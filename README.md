# mcp-ec-front

Gemini API と MCP (Model Context Protocol) を組み合わせた、EC アシスタントのデモアプリです。

- フロントエンド: Vue 3 + Vite
- API サーバー: Express
- ツール実行: MCP クライアント ([server.js](server.js)) + MCP サーバー ([mcp-server.js](mcp-server.js))
- 応答生成: Gemini Function Calling

## 概要

ユーザーの入力を [server.js](server.js) の `/api/chat` に送信し、Gemini が必要に応じて MCP ツールを呼び出します。
現在は社員情報、レシピ、商品、カート、お気に入り、注文照会などの EC 操作をモック中心で扱えます。

チャット UI には以下の機能があります。

- 会話の流れを引き継いだチャット応答
- Tools メニューから開く `Commerce Desk`
- Tools メニューから開く `Conversation Record`
- カート操作を行う `AI Clipboard Drawer`

## 現在の実装状況

Gateway は共通化済みです。

- 共通業務ロジック: [src/gateways/createCommerceGateway.js](src/gateways/createCommerceGateway.js)
- mock データソース: [src/gateways/mock/createMockDataSource.js](src/gateways/mock/createMockDataSource.js)
- mock データ本体: [src/gateways/mock/mockDatabase.js](src/gateways/mock/mockDatabase.js)
- external データソース入口: [src/gateways/external/createExternalDataSource.js](src/gateways/external/createExternalDataSource.js)
- gateway 切替入口: [src/gateways/externalApiGateway.js](src/gateways/externalApiGateway.js)

`mock` モードでは mockDatabase からデータを取得します。
`local` / `production` モードでは external data source を使う構成ですが、現時点では external data source は `getEmployeeInfo`、`getRecipeByKeyword`、`getItemInfoById` 以外は未実装です。未実装メソッドは明示的にエラーを返します。

そのため、現状で安定して動作確認できるモードは `mock` です。

## ディレクトリ構成

```text
mcp-ec-front/
├─ index.html
├─ package.json
├─ server.js
├─ mcp-server.js
├─ vite.config.js
├─ src/
│  ├─ app/
│  │  ├─ index.js
│  │  └─ config/
│  │     └─ env.js
│  ├─ assets/
│  │  └─ styles.css
│  ├─ components/
│  │  ├─ AiClipboardDrawer.vue
│  │  ├─ AppHeader.vue
│  │  ├─ ChatInputBar.vue
│  │  ├─ ChatMessageList.vue
│  │  ├─ CommerceDeskPanel.vue
│  │  ├─ CommerceExperiencePanel.vue
│  │  ├─ CommerceInlineSections.vue
│  │  ├─ ConversationRecordPanel.vue
│  │  └─ ToolMenuPanel.vue
│  ├─ gateways/
│  │  ├─ createCommerceGateway.js
│  │  ├─ externalApiGateway.js
│  │  ├─ external/
│  │  │  ├─ createExternalDataSource.js
│  │  │  └─ createMixedGateway.js
│  │  └─ mock/
│  │     ├─ createMockDataSource.js
│  │     ├─ createMockGateway.js
│  │     └─ mockDatabase.js
│  ├─ infra/
│  │  └─ http/
│  │     ├─ client.js
│  │     └─ retry.js
│  ├─ mcp/
│  │  ├─ server.js
│  │  ├─ schemas/
│  │  │  └─ toolSchemas.js
│  │  └─ tools/
│  │     ├─ employeeTool.js
│  │     ├─ itemTool.js
│  │     ├─ recipeTool.js
│  │     └─ runtimeDiagnosticsTool.js
│  ├─ services/
│  │  ├─ chatApi.js
│  │  └─ commerceApi.js
│  ├─ shared/
│  │  ├─ errors/
│  │  │  └─ AppError.js
│  │  └─ logger/
│  │     └─ logger.js
│  ├─ usecases/
│  │  ├─ commerceUseCases.js
│  │  ├─ getEmployeeInfo.js
│  │  ├─ getItemInfoById.js
│  │  ├─ getRecipeByKeyword.js
│  │  └─ getRuntimeDiagnostics.js
│  ├─ App.vue
│  └─ main.js
└─ public/
```

## アーキテクチャ

### チャットの流れ

1. フロントの [src/App.vue](src/App.vue) が [src/services/chatApi.js](src/services/chatApi.js) 経由で `/api/chat` を呼びます。
2. [server.js](server.js) が MCP クライアント経由で利用可能ツールを取得します。
3. Gemini にツール定義を渡して function calling を実行します。
4. Gemini が返した function call を MCP ツールで実行します。
5. ツール結果を Gemini に返して最終回答を生成します。
6. フロントへ回答テキスト、ツール実行結果、会話記録を返します。

### MCP サーバー内部構成

1. プレゼン層: [src/mcp](src/mcp)
2. ユースケース層: [src/usecases](src/usecases)
3. Gateway 層: [src/gateways](src/gateways)
4. 共通基盤: [src/infra](src/infra)、[src/shared](src/shared)
5. 設定層: [src/app/config](src/app/config)

### Gateway 層の考え方

- `createCommerceGateway` が業務ロジックを持つ
- `dataSource` がデータ取得元を隠蔽する
- `mock` モードでは mockDatabase ベースの data source を使う
- `local` / `production` では external data source を使う

この構成により、将来的に mock と同等のデータを外部 API から取得するようになっても、Gateway 本体のロジックを再利用できます。

## MCP ツール

現在の主なツールは以下です。

- `get_employee_info`
- `get_recipe_by_keyword`
- `get_item_info_by_id`
- `search_products`
- `get_product_details`
- `get_featured_products`
- `get_cart`
- `add_item_to_cart`
- `update_cart_item_quantity`
- `remove_item_from_cart`
- `apply_coupon_to_cart`
- `get_customer_profile`
- `get_loyalty_summary`
- `get_wishlist`
- `add_item_to_wishlist`
- `get_order_history`
- `get_order_details`
- `get_runtime_diagnostics`

ツール定義は [src/mcp/schemas/toolSchemas.js](src/mcp/schemas/toolSchemas.js) にあります。

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. 環境変数設定

ルートに `.env` を作成し、最低限 Gemini API キーを設定します。

```env
GEMINI_API_KEY=your_api_key_here
```

起動環境は `EXTERNAL_API_MODE` で切り替えます。

- `mock`: mockDatabase を利用
- `local`: ローカル GraphQL / external data source を利用
- `production`: 本番 GraphQL / external data source を利用

共通設定例:

```env
EXTERNAL_API_MODE=mock

EXTERNAL_API_TIMEOUT_MS=4000
EXTERNAL_API_RETRY_COUNT=2
EXTERNAL_API_RETRY_DELAY_MS=300

GRAPHQL_API_ENDPOINT=
GRAPHQL_API_TOKEN=
GRAPHQL_API_USER_ID=mcp-server
```

`local` モード例:

```env
EXTERNAL_API_MODE=local
GRAPHQL_API_ENDPOINT=http://localhost:8081/graphql
GRAPHQL_API_USER_ID=local-dev
```

`production` モード例:

```env
EXTERNAL_API_MODE=production
GRAPHQL_API_ENDPOINT=https://your-graphql.example.com/graphql
GRAPHQL_API_TOKEN=your_production_token
GRAPHQL_API_USER_ID=mcp-server
```

補足:

- `EXTERNAL_API_MODE` 未設定時は後方互換として `USE_EXTERNAL_APIS` を参照します。
- `EXTERNAL_API_MODE=local` で `GRAPHQL_API_ENDPOINT` 未設定時は `http://localhost:8081/graphql` を既定値として使います。
- 現時点では `mock` モードが主運用です。

### 3. フロントビルド

```bash
npm run build
```

`public/` はビルド成果物です。手編集した内容はビルド時に上書きされます。

### 4. サーバー起動

```bash
npm start
```

起動後: `http://localhost:3000`

### 5. モード別起動

```bash
npm run start:mock
npm run start:local
npm run start:production
```

読み込み順は `.env` → `env/.env.<mode>` です。

## 開発コマンド

- `npm run dev`: Vite 開発サーバー
- `npm run build`: 本番ビルド
- `npm run preview`: ビルド結果のプレビュー
- `npm start`: Express サーバー
- `npm run start:mock`: mock モード起動
- `npm run start:local`: local モード起動
- `npm run start:production`: production モード起動

## 注意点

### external mode は一部未実装

[src/gateways/external/createExternalDataSource.js](src/gateways/external/createExternalDataSource.js) では、employee / recipe / item 以外のデータ取得は未実装です。
そのため `local` や `production` で商品一覧、カート、注文、会員情報などを使うと、未実装エラーになります。

### フロント変更時の反映

`src/` を変更した場合、`npm run build` を実行して `public/` へ反映してください。
`npm start` は `public/` を配信します。

### Gemini の高負荷

`503 Service Unavailable` や high demand は Gemini 側の一時的高負荷です。時間を空けて再試行してください。

### Unknown tool

Gemini が要求したツール名と MCP の定義名が不一致だと発生します。
[src/mcp/schemas/toolSchemas.js](src/mcp/schemas/toolSchemas.js) の定義と [server.js](server.js) のログを確認してください。

## 補足

- 会話の流れはチャット中のメモリ上で保持します。
- `Conversation Record` は常時表示ではなく Tools メニューから開く方式です。
- `Commerce Desk` も Tools メニューから開く方式です。
- [src/app/index.js](src/app/index.js) では HTTP クライアントを生成していますが、external data source への完全注入はこれからです。