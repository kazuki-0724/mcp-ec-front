# Configuration

## 基本方針

設定は主に環境変数で行います。親プロセスと MCP 子プロセスは別プロセスですが、
必要な値は親から子へ引き継がれます。

## env ファイルの読み込み順

起動 script は次の順で env を読み込みます。

1. ルートの `.env`
2. `env/.env.mock` または `env/.env.local` または `env/.env.production`

後に読み込まれる値が優先されるため、共通設定は `.env` に、
モード固有設定は `env/.env.<mode>` に分離します。

## 現在の env ファイル例

- `env/.env.mock`
- `env/.env.local`
- `env/.env.production`

## 主な環境変数

### 必須

- `GEMINI_API_KEY`: Gemini API キー

### 実行モード

- `EXTERNAL_API_MODE`: `mock` / `local` / `production`
- `USE_EXTERNAL_APIS`: 後方互換用。`true` なら `production` 扱い

`USE_EXTERNAL_APIS` は後方互換のための補助フラグです。新規設定では
`EXTERNAL_API_MODE` を明示する運用を推奨します。

### GraphQL 接続設定

- `GRAPHQL_API_ENDPOINT`: GraphQL endpoint
- `GRAPHQL_API_TOKEN`: Bearer token
- `GRAPHQL_API_USER_ID`: `X-User-Id` として送る識別子 (未設定時は `mcp-server`)

`EXTERNAL_API_MODE=local` かつ `GRAPHQL_API_ENDPOINT` 未設定時は、
`http://localhost:8081/graphql` が既定値になります。

`EXTERNAL_API_MODE=production` では `GRAPHQL_API_ENDPOINT` が必須です。
未設定のまま起動するとエラーになります。

### HTTP クライアント設定

- `EXTERNAL_API_TIMEOUT_MS`: タイムアウト (既定値: `4000`)
- `EXTERNAL_API_RETRY_COUNT`: リトライ回数 (既定値: `2`)
- `EXTERNAL_API_RETRY_DELAY_MS`: リトライ間隔 (既定値: `300`)

### サーバー設定

- `PORT`: Express の待受ポート (既定値: `3000`)

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

## 親プロセスから MCP 子プロセスへの引き継ぎ

親プロセスはモード解決後、必要な設定を MCP 子プロセスへ渡します。
主に次の値が引き継がれます。

- `EXTERNAL_API_MODE`
- `GRAPHQL_API_ENDPOINT`
- `GRAPHQL_API_USER_ID`
- `GRAPHQL_API_TOKEN`

このため、親子で mode や endpoint がずれることを防げます。

## 設定確認に使える開発用 API

起動後、次の API で現在の解決結果を確認できます。

- `/api/dev/external-target`: 親プロセス側の mode / endpoint
- `/api/dev/mcp-runtime-diagnostics`: MCP 子プロセス側の診断結果

## 関連ドキュメント

- 前の手順: [01_installation.md](01_installation.md)
- モード詳細: [../04_runtime_modes/README.md](../04_runtime_modes/README.md)
- システム構成: [../02_architecture/README.md](../02_architecture/README.md)