# System Overview

## 全体像

このアプリは、Vue フロントエンド、Express 親プロセス、MCP 子プロセス、Gateway / Usecase 層で構成されています。

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

### MCP 子プロセス

- `mcp-server.js`: 子プロセスのエントリポイント
- `src/app/index.js`: 子プロセス組み立て
- `src/mcp/server.js`: MCP サーバー定義
- `src/mcp/registry/toolRegistry.js`: ツール定義 registry

### ビジネスロジック

- `src/usecases/commerceUseCases.js`: ユースケース群
- `src/gateways/createCommerceGateway.js`: 共通の EC 業務ロジック
- `src/gateways/mock/createMockDataSource.js`: mock データソース
- `src/gateways/external/createExternalDataSource.js`: external adapter
- `src/gateways/external/createGraphqlCommerceApis.js`: GraphQL wrapper

## レイヤー責務

### UI 層

表示と状態遷移に集中します。データ取得は `/api/chat` と `/api/mcp/tool` を通します。

### API 層

Gemini と MCP を仲介し、会話履歴、リトライ、エラー整形を扱います。

### MCP 層

ツール一覧公開とツール実行を担当します。

### Usecase 層

入力検証と戻り値整形を担当します。

### Gateway 層

データ取得元差し替えを吸収し、mock / local / production の違いを閉じ込めます。