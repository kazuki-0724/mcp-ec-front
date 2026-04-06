# Server And Client

## 親プロセス

親プロセスのエントリポイントは `server.js` です。ここで次を行います。

1. `.env` の読み込み
2. Gemini クライアント生成
3. external target 解決
4. MCP クライアント生成と接続
5. Express アプリ起動

## MCP クライアント

`src/server/mcp/createMcpClient.js` は `StdioClientTransport` を使って `node mcp-server.js` を起動します。

### 役割

- 子プロセス起動
- listTools の取得
- callTool の実行
- unknown tool の事前検出

### 子プロセスへ渡す値

- `EXTERNAL_API_MODE`
- `GRAPHQL_API_ENDPOINT`
- `GRAPHQL_API_USER_ID`
- `GRAPHQL_API_TOKEN`

## 子プロセス

子プロセスのエントリポイントは `mcp-server.js` です。実体は `src/app/index.js` の `startMcpApp()` です。

### 起動時の処理

1. mode と外部 API 設定の読み込み
2. HTTP クライアント生成
3. GraphQL wrapper 生成
4. gateway 組み立て
5. usecase 生成
6. MCP サーバー起動