# System Overview

## 全体像

このアプリは、Vue フロントエンド、Express 親プロセス、MCP 子プロセス、Gateway / Usecase 層で構成されています。

外部連携の文脈で出てくる `external` は、外部 GraphQL サービスそのものに加えて、
その呼び出しを吸収する data source / gateway adapter を含む概念として扱います。

## 主要コンポーネント

### フロントエンド

- `src/App.vue`: 画面の接着層
- `src/composables/useChatState.js`: チャット状態管理
- `src/composables/useCommerceState.js`: EC 状態管理
- `src/composables/useDeveloperTools.js`: 開発補助情報の取得

### Express 親プロセス

- `server.js`: 親プロセスのエントリポイント
- `src/server/createApp.js`: Express アプリ組み立て
- `src/server/chat/createChatController.js`: Gemini Function Calling 制御
- `src/server/mcp/createMcpClient.js`: MCP 子プロセスへの stdio クライアント

`createApp` では、用途に応じて次の 2 つの実行入口を公開します。

- `/api/chat`: Gemini を介して tool call を段階実行する会話経路
- `/api/mcp/tool`: Gemini を介さず特定ツールを直接叩く経路

### MCP 子プロセス

- `mcp-server.js`: 子プロセスのエントリポイント
- `src/app/index.js`: 子プロセス組み立て
- `src/mcp/server.js`: MCP サーバー定義
- `src/mcp/registry/toolRegistry.js`: ツール定義 registry

### ビジネスロジック

- `src/usecases/commerceUseCases.js`: ユースケース群
- `src/usecases/helpers/createValidatedUsecase.js`: 入力検証と validation error の整形
- `src/gateways/createCommerceGateway.js`: 共通の EC 業務ロジック
- `src/gateways/mock/createMockDataSource.js`: mock データソース
- `src/gateways/external/createExternalDataSource.js`: external adapter
- `src/gateways/external/createGraphqlCommerceApis.js`: GraphQL wrapper

## レイヤー責務

### UI 層

表示と状態遷移に集中します。データ取得は `/api/chat` と `/api/mcp/tool` を通します。

### API 層

Gemini と MCP を仲介し、会話履歴、リトライ、エラー整形を扱います。

特に chat 経路では、履歴サニタイズ、tool call ループ防止、unknown tool 応答を
親プロセス側で担保します。

### MCP 層

ツール一覧公開とツール実行を担当します。

### Usecase 層

入力検証と戻り値整形を担当します。

`createValidatedUsecase` を通すことで、検証エラーを一貫して
`{ error: ... }` 形式で返せるようにしています。

### Gateway 層

データ取得元差し替えを吸収し、mock / local / production の違いを閉じ込めます。

local mode では mixed gateway により、external で未実装の API を
mock data source にフォールバックする設計です。

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- リクエスト詳細: [02_request_flow.md](02_request_flow.md)
- mode 切り替えの詳細: [../04_runtime_modes/README.md](../04_runtime_modes/README.md)