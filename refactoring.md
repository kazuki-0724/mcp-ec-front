# mcp-ec-front リファクタリング案

## 目的

このドキュメントは、現状の実装を踏まえて、保守性・拡張性・テスト容易性を上げるためのリファクタリング方針を整理したものです。

現時点のコードベースは、以下の点で土台は悪くありません。

- フロントエンド、MCP、gateway、usecase という大まかな責務分割はすでにある
- mock と external を切り替える構成があり、将来の差し替え前提が見えている
- HTTP リトライや AppError など、共通化の芽がある

一方で、いまのまま機能追加を続けると、次の問題が強くなります。

- 画面状態が [src/App.vue](src/App.vue) に集中して変更影響が広い
- サーバー側のチャット制御が [server.js](server.js) に集まり、テストしづらい
- tool schema、usecase、tool handler の対応関係が分散し、仕様ずれが起きやすい
- gateway に業務ロジックが入り込み、層の責務が曖昧になっている

このため、全面書き換えではなく、段階的に責務を分離していく方針を推奨します。

## 現状の主要課題

### 1. 【対応済】App.vue に状態と処理が集中している

対象:

- [src/App.vue](src/App.vue)

観測内容:

- チャット状態、EC 状態、開閉 UI 状態、Developer Menu 状態が 1 ファイルに同居している
- `ref` が大量にあり、状態のまとまりがコード上に表現されていない
- `sendPrompt`, `refreshCommerceOverview`, `runProbe`, `fetchRuntimeDiagnostics` など、責務の異なる処理が同じ場所にある
- 画面表示ロジックと API 呼び出し後の状態反映ロジックが密結合している

問題:

- 影響範囲の見積もりが難しい
- 子コンポーネントへの props が増えやすい
- 一部機能だけを単体で差し替えたりテストしたりしにくい

推奨対応:

- `useChatState` を作り、メッセージ、conversation history、送信処理を分離する
- `useCommerceState` を作り、cart、wishlist、orders、customer profile、coupon を分離する
- `useDeveloperTools` を作り、external target、probe、runtime diagnostics を分離する
- `App.vue` は画面構成と composable の接着に寄せる

完成イメージ:

```text
App.vue
├─ useChatState()
├─ useCommerceState()
└─ useDeveloperTools()
```

優先度: 最優先

対応結果:

- [src/composables/useChatState.js](src/composables/useChatState.js) を追加
- [src/composables/useCommerceState.js](src/composables/useCommerceState.js) を追加
- [src/composables/useDeveloperTools.js](src/composables/useDeveloperTools.js) を追加
- [src/components/DeveloperConsole.vue](src/components/DeveloperConsole.vue) を追加
- [src/App.vue](src/App.vue) を composable の接着層へ整理

---

### 2. 【対応済】server.js がオーケストレーションを抱え込みすぎている

対象:

- [server.js](server.js)

観測内容:

- Express 初期化
- Gemini クライアント生成
- MCP client 初期化
- 会話履歴の整形
- リトライ処理
- tool 実行補助
- dev 用エンドポイント

これらが単一ファイルに集約されている。

問題:

- ユニットテストの切り出しが難しい
- チャット本体と dev 補助機能の境界がない
- 設定解決、Gemini 呼び出し、MCP 呼び出しが独立して再利用できない

推奨対応:

- `src/server/createApp.js` に Express 組み立てを寄せる
- `src/server/chat/createChatController.js` に `/api/chat` の責務を分離する
- `src/server/dev/createDevRouter.js` に `/api/dev/*` を隔離する
- `src/server/mcp/createMcpClient.js` に MCP client 初期化を分離する
- 会話履歴整形は `src/shared/conversation` などの共通モジュールへ寄せる

補足:

- [src/App.vue](src/App.vue) と [server.js](server.js) の両方に conversation history の正規化思想があり、今後ずれやすい
- 共有可能なフォーマット関数は片側に寄せるべき

優先度: 最優先

対応結果:

- [src/server/createApp.js](src/server/createApp.js) を追加し、Express 組み立てを分離
- [src/server/chat/createChatController.js](src/server/chat/createChatController.js) を追加し、`/api/chat` の責務を分離
- [src/server/dev/createDevRouter.js](src/server/dev/createDevRouter.js) を追加し、`/api/dev/*` を分離
- [src/server/mcp/createMcpClient.js](src/server/mcp/createMcpClient.js) を追加し、MCP client 初期化を分離
- [src/shared/conversation/history.js](src/shared/conversation/history.js) を追加し、会話履歴整形を共通化
- [server.js](server.js) を最小エントリポイントへ整理

---

### 3. 【対応済】gateway 層に業務ロジックが入り込みすぎている

対象:

- [src/gateways/createCommerceGateway.js](src/gateways/createCommerceGateway.js)
- [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js)

観測内容:

- `calculateLine`, `summarizeCart`, `getCustomerTier` など、価格計算や割引ルールが gateway 側にある
- usecase は入力整形とエラーメッセージ返却が中心で、業務ロジック層としては薄い

問題:

- 「どこにビジネスルールがあるか」が直感に反する
- gateway の再利用時に意図しない業務ルールまで抱える
- pricing rule の変更や AB テストがしにくい

推奨対応:

- gateway はデータ取得・結合・永続化に寄せる
- usecase は業務ルールの実行単位として厚くする
- 少なくとも以下は usecase か domain service に移す

	- 会員ランク正規化
	- 数量割引計算
	- クーポン適用判定
	- カート集計

分離後の目安:

- gateway: データソースを隠蔽する
- usecase: ユースケース単位の入出力をまとめる
- domain service: 再利用したい計算ロジックを保持する

優先度: 高

対応結果:

- [src/domain/commerce/pricing.js](src/domain/commerce/pricing.js) を追加し、会員ランク正規化、価格計算、クーポン計算、カート集計、送料見積、在庫状態判定を domain 化
- [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js) でカート・見積・クーポン関連の業務ロジックを usecase 側へ移動
- [src/gateways/createCommerceGateway.js](src/gateways/createCommerceGateway.js) は raw データ取得用メソッドを持つ形へ整理

---

### 4. 【対応済】usecase の入力検証が重複している

対象:

- [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js)

観測内容:

- `toTrimmedString` と `toPositiveInteger` を使った手続き的な検証が多くのメソッドで繰り返されている
- `itemId`, `customerId`, `limit`, `quantity` の検証パターンが何度も出てくる

問題:

- 入力検証ルールの変更が横断修正になる
- エラーメッセージの表現ゆれが起きやすい
- schema ベースの検証に進みにくい

推奨対応:

- AJV を使って tool schema と usecase 検証を近づける
- もしくは `createValidatedUsecase` のような小さなラッパーを作る
- まずは以下の共通化から着手する

	- 必須文字列
	- 正の整数
	- 0 以上の整数
	- ID 文字列

例:

```js
const getOrderDetails = createValidatedUsecase({
	schema: orderDetailsSchema,
	handler: async ({ orderId }, deps) => deps.gateway.getOrderDetails(orderId)
});
```

優先度: 高

対応結果:

- [src/usecases/helpers/createValidatedUsecase.js](src/usecases/helpers/createValidatedUsecase.js) を追加
- [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js) の必須文字列、正の整数、0 以上整数の検証を共通ラッパーへ移行
- usecase ごとの入力エラー返却を統一し、重複した手続き的検証を削減

---

### 5. 【対応済】MCP ツール定義と実装の対応が分散している

対象:

- [src/mcp/schemas/toolSchemas.js](src/mcp/schemas/toolSchemas.js)
- [src/mcp/server.js](src/mcp/server.js)
- [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js)

観測内容:

- tool 定義は `TOOL_DEFINITIONS` に配列で列挙されている
- 実行時は `usecases[toolName]` で引く方式になっている
- schema と handler の関係がコード上で明示されていない

問題:

- schema だけ追加して handler を忘れる事故が起きやすい
- handler の rename 時に対応漏れが起きやすい
- MCP のエントリポイントとしての見通しが弱い

推奨対応:

- ツールを registry 化する
- 1 つの定義に `name`, `description`, `inputSchema`, `handler` をまとめる
- `ListToolsRequestSchema` には registry から schema だけを渡す
- `CallToolRequestSchema` では同じ registry から handler を引く

例:

```js
export const commerceToolRegistry = [
	{
		name: 'get_cart',
		description: '現在のカート状態を返します。',
		inputSchema: { type: 'object', properties: {}, required: [] },
		handler: ({ usecases }) => usecases.get_cart
	}
];
```

優先度: 高

対応結果:

- [src/mcp/registry/toolRegistry.js](src/mcp/registry/toolRegistry.js) を追加し、tool schema と handler 名の宣言を集約
- [src/mcp/server.js](src/mcp/server.js) は registry から tool 一覧と handler を解決する構成へ変更
- [src/mcp/schemas/toolSchemas.js](src/mcp/schemas/toolSchemas.js) は registry 由来の定義を返す互換層に整理

---

### 6. 【対応不要】Developer Menu の責務が本体 UI と混ざっている

対象:

- [src/App.vue](src/App.vue)
- [server.js](server.js)

観測内容:

- developer 向け probe UI と本来の EC アシスタント UI が同じ画面状態に載っている
- サーバー側も dev 系 API が本番 API と同じファイルで管理されている

問題:

- 本番向け機能と検証用機能の境界が曖昧
- UI 改修時に developer 向け機能まで巻き込みやすい
- feature flag や環境別制御が入れづらい

推奨対応:

- フロントは `DeveloperConsole` コンポーネントに分離する
- サーバーは dev router を分ける
- 必要なら `ENABLE_DEVTOOLS=true` のようなフラグで露出制御する

優先度: 中

---

### 7. 【対応済】Commerce API クライアントが薄い一方で抽象化の一貫性が弱い

対象:

- [src/services/commerceApi.js](src/services/commerceApi.js)
- [src/services/chatApi.js](src/services/chatApi.js)

観測内容:

- `commerceApi.js` は `callTool` を共通化しているが、レスポンス変換や例外整形は最小限
- `chatApi.js` と共通する fetch ラッパーが存在しない

問題:

- API 呼び出し共通仕様がファイルごとに分かれる
- タイムアウト、ログ、trace id、標準エラー形が今後増えると拡張しにくい

推奨対応:

- `src/infra/http` をフロント側にも使える形へ整理する
- `fetchJson` のような最小ラッパーを共通化する
- `postChat` と `callTool` のエラー整形を揃える

優先度: 中

対応結果:

- [src/infra/http/fetchJson.js](src/infra/http/fetchJson.js) を追加し、フロントの fetch/JSON/エラー整形を共通化
- [src/services/chatApi.js](src/services/chatApi.js) と [src/services/commerceApi.js](src/services/commerceApi.js) は `fetchJson` 利用へ統一
- [src/composables/useDeveloperTools.js](src/composables/useDeveloperTools.js) も同じ HTTP ヘルパーに寄せ、一貫したエラー処理へ整理

---

### 8. 【対応不要】external data source が未実装中心で、契約境界が曖昧

対象:

- [src/gateways/external/createExternalDataSource.js](src/gateways/external/createExternalDataSource.js)

観測内容:

- 実装済みメソッドは一部のみ
- 多くが `createNotImplemented` を返している
- local mode 用の shape validation がデータソース内に埋まっている

問題:

- mock と external の差分が広がる
- 実運用へ進める際の不確実性が高い
- 入出力契約をどこで保証するかが曖昧

推奨対応:

- external API の I/O 契約を先に文章化する
- adapter 層で外部レスポンスを内部モデルへ変換する
- validation は adapter 境界または schema で扱い、data source の内部に閉じ込めすぎない

優先度: 中

## 優先順位付きの実施計画

### Phase 1: 低リスクで効果が高い整理

目標:

- 影響範囲を広げずに、今後の分離作業をやりやすくする

作業項目:

1. [src/App.vue](src/App.vue) から Developer Menu をコンポーネント分離する
2. [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js) の入力検証を共通化する
3. [src/services/chatApi.js](src/services/chatApi.js) と [src/services/commerceApi.js](src/services/commerceApi.js) の fetch エラーハンドリングを揃える

期待効果:

- すぐにファイルの見通しが良くなる
- 次段階の composable 分離がやりやすくなる

### Phase 2: フロントの状態管理を分離する

目標:

- 画面コンポーネントと状態遷移を分ける

作業項目:

1. `src/composables/useChatState.js` を新設
2. `src/composables/useCommerceState.js` を新設
3. `src/composables/useDeveloperTools.js` を新設
4. [src/App.vue](src/App.vue) は画面レイアウト中心に縮小する

期待効果:

- 表示改修とロジック改修の衝突が減る
- composable 単位でテストしやすくなる

### Phase 3: サーバーの責務を分離する

目標:

- チャット制御、dev API、MCP 接続、設定解決を個別に扱えるようにする

作業項目:

1. [server.js](server.js) を app factory ベースに分割する
2. Gemini 呼び出しと retry をモジュール化する
3. conversation history の整形を共通モジュールへ寄せる
4. dev router を分ける

期待効果:

- 変更影響を限定しやすい
- 将来的に API サーバーを増やす場合も再利用しやすい

### Phase 4: ツール定義と業務ロジックを整理する

目標:

- MCP tool 定義と usecase 実装の対応を明確化する
- 層ごとの責務を正す

作業項目:

1. tool registry を導入する
2. schema と handler を 1 か所で宣言する
3. 割引計算、カート集計などを usecase または domain service に移す

期待効果:

- ツール追加時の事故が減る
- pricing rule や cart rule の変更が追いやすくなる

## 具体的なディレクトリ再編案

一例として、次のような構成が考えられます。

```text
src/
├─ app/
│  ├─ config/
│  └─ conversation/
├─ composables/
│  ├─ useChatState.js
│  ├─ useCommerceState.js
│  └─ useDeveloperTools.js
├─ domain/
│  └─ commerce/
│     ├─ pricing.js
│     ├─ cart.js
│     └─ customerTier.js
├─ mcp/
│  ├─ registry/
│  │  └─ commerceTools.js
│  ├─ schemas/
│  └─ server.js
├─ server/
│  ├─ chat/
│  ├─ dev/
│  ├─ mcp/
│  └─ createApp.js
└─ shared/
	 ├─ errors/
	 └─ conversation/
```

全面移行は不要で、既存構成を活かしながら段階移行で十分です。

## すぐに着手しやすい Quick Win

短時間で効果が出やすいものは次の 4 点です。

1. [src/App.vue](src/App.vue) の developer セクションを別コンポーネントへ分ける
2. [src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js) の検証処理を共通関数へまとめる
3. [src/mcp/schemas/toolSchemas.js](src/mcp/schemas/toolSchemas.js) と [src/mcp/server.js](src/mcp/server.js) の間に registry を入れる
4. [server.js](server.js) から dev API を別 router へ出す

この 4 つは、機能仕様を大きく変えずに見通しを改善できます。

## 維持したい良い点

リファクタリング時にも、次の長所は維持した方がよいです。

- [src/mcp/server.js](src/mcp/server.js) のシンプルなリクエスト処理構造
- [src/gateways/createCommerceGateway.js](src/gateways/createCommerceGateway.js) の mock/external 切り替え前提
- [src/infra/http/client.js](src/infra/http/client.js) と [src/infra/http/retry.js](src/infra/http/retry.js) に見られる基盤化の方向性
- [src/shared/errors/AppError.js](src/shared/errors/AppError.js) のエラー統一方針

## 結論

このプロジェクトのリファクタリングは、まず [src/App.vue](src/App.vue) と [server.js](server.js) の責務分離から始めるのが最も効果的です。

その次に、[src/usecases/commerceUseCases.js](src/usecases/commerceUseCases.js) と [src/gateways/createCommerceGateway.js](src/gateways/createCommerceGateway.js) の境界を整理し、最後に MCP tool registry を導入すると、構造の一貫性がかなり上がります。

全面的な作り直しは不要です。既存の mock/external 切り替え構成と MCP 連携の流れは活かしつつ、責務を分けていく方がコストに対して効果が高いです。
