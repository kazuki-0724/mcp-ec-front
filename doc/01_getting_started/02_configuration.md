# Configuration

## 基本方針

設定は主に環境変数で行います。親プロセスと MCP 子プロセスは別プロセスですが、必要な値は親から子へ引き継がれます。

## 主な環境変数

### 必須

- `GEMINI_API_KEY`: Gemini API キー

### 実行モード

- `EXTERNAL_API_MODE`: `mock` / `local` / `production`
- `USE_EXTERNAL_APIS`: 後方互換用。`true` なら `production` 扱い

### GraphQL 接続設定

- `GRAPHQL_API_ENDPOINT`: GraphQL endpoint
- `GRAPHQL_API_TOKEN`: Bearer token
- `GRAPHQL_API_USER_ID`: `X-User-Id` として送る識別子

### HTTP クライアント設定

- `EXTERNAL_API_TIMEOUT_MS`: タイムアウト
- `EXTERNAL_API_RETRY_COUNT`: リトライ回数
- `EXTERNAL_API_RETRY_DELAY_MS`: リトライ間隔

### サーバー設定

- `PORT`: Express の待受ポート

## 設定例

### mock

```env
EXTERNAL_API_MODE=mock
PORT=3000
```

### local

```env
EXTERNAL_API_MODE=local
GRAPHQL_API_ENDPOINT=http://localhost:8081/graphql
GRAPHQL_API_USER_ID=local-dev
PORT=3000
```

### production

```env
EXTERNAL_API_MODE=production
GRAPHQL_API_ENDPOINT=https://your-graphql.example.com/graphql
GRAPHQL_API_TOKEN=your_production_token
GRAPHQL_API_USER_ID=mcp-server
PORT=3000
```

## モード解決ルール

1. `EXTERNAL_API_MODE` が最優先
2. 未設定なら `USE_EXTERNAL_APIS` を参照
3. `USE_EXTERNAL_APIS=true` は `production`
4. それ以外は `mock`

## local モードの既定値

`EXTERNAL_API_MODE=local` かつ `GRAPHQL_API_ENDPOINT` 未設定時は `http://localhost:8081/graphql` を既定値として使います。

## 参考

モード切り替えの詳細は [../04_runtime_modes/README.md](../04_runtime_modes/README.md) を参照してください。