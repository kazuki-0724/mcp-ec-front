# function-calling

Gemini API と MCP (Model Context Protocol) を組み合わせた、Function Calling デモアプリです。

- フロントエンド: Vue 3 + Vite
- API サーバー: Express
- ツール実行: MCP クライアント (`server.js`) + MCP サーバー (`mcp-server.js`)

## 概要

ユーザーの入力を `/api/chat` に送信し、Gemini が必要に応じて MCP ツールを呼び出します。
このプロジェクトでは、社員情報取得と、レシピ -> 商品情報取得のデモツールを提供しています。
MCPサーバーは責務分離済みで、プレゼン層・ユースケース層・インフラ層・設定層の構成になっています。

## ディレクトリ構成

```text
function-calling/
├─ .env
├─ index.html                # Vite エントリ
├─ package.json
├─ server.js                 # Express + Gemini + MCPクライアント
├─ mcp-server.js             # MCPサーバー起動エントリ
├─ vite.config.js
├─ src/
│  ├─ app/
│  │  ├─ index.js            # MCPアプリ組み立て
│  │  └─ config/
│  │     └─ env.js           # 環境変数ロード
│  ├─ mcp/
│  │  ├─ server.js           # MCPサーバー（ツール公開とルーティング）
│  │  ├─ schemas/
│  │  │  └─ toolSchemas.js
│  │  └─ tools/
│  │     ├─ employeeTool.js
│  │     ├─ recipeTool.js
│  │     └─ itemTool.js
│  ├─ usecases/
│  │  ├─ getEmployeeInfo.js
│  │  ├─ getRecipeByKeyword.js
│  │  └─ getItemInfoById.js
│  ├─ gateways/
│  │  └─ externalApiGateway.js
│  ├─ infra/
│  │  ├─ http/
│  │  │  ├─ client.js
│  │  │  └─ retry.js
│  │  └─ externalApis/
│  │     ├─ employeeApi.js
│  │     ├─ recipeApi.js
│  │     └─ itemApi.js
│  ├─ shared/
│  │  ├─ errors/
│  │  │  └─ AppError.js
│  │  └─ logger/
│  │     └─ logger.js
│  ├─ main.js
│  ├─ App.vue
│  ├─ assets/
│  │  └─ styles.css
│  ├─ components/
│  │  ├─ AppHeader.vue
│  │  ├─ ChatMessageList.vue
│  │  └─ ChatInputBar.vue
│  └─ services/
│     └─ chatApi.js
└─ public/                   # ビルド成果物のみ（npm run build で生成）
```

## アーキテクチャ

1. フロント (`src/App.vue`) が `postChat` (`src/services/chatApi.js`) を呼ぶ
2. Express (`server.js`) の `/api/chat` がリクエスト受信
3. `server.js` が MCP クライアント経由で利用可能ツールを取得
4. Gemini にツール定義を渡して `sendMessage`
5. Gemini が function call を返したら MCP ツールを実行
6. ツール結果を Gemini に返して最終回答を生成
7. フロントへ `{ text }` を返却

### MCPサーバー内部構成

1. プレゼン層 (`src/mcp`) 
- MCPツール定義とハンドラのルーティング
2. ユースケース層 (`src/usecases`)
- ツールごとの業務フロー
3. インフラ層 (`src/infra`)
- 共通HTTPクライアント、リトライ、外部APIクライアント
4. 設定層 (`src/app/config`)
- 環境変数のロードと切替設定
5. Gateway層 (`src/gateways`)
- モック実装と外部API実装の切替

## MCP ツール

以下のツールを提供しています。

- `get_employee_info`
  - 社員IDから社員情報を取得
- `get_recipe_by_keyword`
  - キーワードからレシピ情報と必要具材情報を取得
- `get_item_info_by_id`
  - 商品IDから商品詳細を取得

## セットアップ

### 1) 依存インストール

```bash
npm install
```

### 2) 環境変数設定

ルートに `.env` を作成し、最低限 Gemini APIキーを設定します。

```env
GEMINI_API_KEY=your_api_key_here
```

起動環境の切り替えは `EXTERNAL_API_MODE` で行います。

- `mock`: 内蔵モックデータを利用
- `local`: ローカルGraphQLサービス（例: `http://localhost:8081/graphql`）を利用
- `production`: 本番GraphQLサービスを利用

以下は共通設定です。

```env
EXTERNAL_API_MODE=mock

EXTERNAL_API_TIMEOUT_MS=4000
EXTERNAL_API_RETRY_COUNT=2
EXTERNAL_API_RETRY_DELAY_MS=300

GRAPHQL_API_ENDPOINT=
GRAPHQL_API_TOKEN=
GRAPHQL_API_USER_ID=mcp-server
```

`local` モードの例:

```env
EXTERNAL_API_MODE=local
GRAPHQL_API_ENDPOINT=http://localhost:8081/graphql
GRAPHQL_API_USER_ID=local-dev
```

`production` モードの例:

```env
EXTERNAL_API_MODE=production
GRAPHQL_API_ENDPOINT=https://your-graphql.example.com/graphql
GRAPHQL_API_TOKEN=your_production_token
GRAPHQL_API_USER_ID=mcp-server
```

補足:
- `EXTERNAL_API_MODE` 未設定時は後方互換として `USE_EXTERNAL_APIS` を参照します。
- `EXTERNAL_API_MODE=local` で `GRAPHQL_API_ENDPOINT` 未設定の場合は `http://localhost:8081/graphql` を既定値として使用します。

旧REST用の以下環境変数は、現在のGraphQL構成では未使用です。
- `EMPLOYEE_API_BASE_URL`, `EMPLOYEE_API_TOKEN`
- `RECIPE_API_BASE_URL`, `RECIPE_API_TOKEN`
- `ITEM_API_BASE_URL`, `ITEM_API_TOKEN`

### 3) フロントをビルド

```bash
npm run build
```

> `public/` はビルド成果物置き場です。手編集したファイルは次回ビルドで上書き/削除されます。

### 4) サーバー起動

```bash
npm start
```

起動後: `http://localhost:3000`

### 5) 起動環境の切り替え手順（おすすめ）

`.env` を毎回書き換えず、モード別ファイルを使う方法です。

```bash
npm run start:mock
npm run start:local
npm run start:production
```

読み込み順は `.env` -> `env/.env.<mode>` です。

- `.env`: 共通値（例: GEMINI_API_KEY）
- `env/.env.mock`: mock モード設定
- `env/.env.local`: local モード設定
- `env/.env.production`: production モード設定

### 6) 手動で切り替える場合

1. `.env` の `EXTERNAL_API_MODE` を設定
2. `local`/`production` では `GRAPHQL_API_ENDPOINT` を設定
3. 必要に応じて `GRAPHQL_API_TOKEN` を設定
4. `npm start` で起動

## 開発時のコマンド

- `npm run dev`: Vite 開発サーバー起動
- `npm run build`: 本番向けビルド (`public/` 出力)
- `npm run preview`: ビルド結果のプレビュー
- `npm start`: Express サーバー起動
- `npm run start:mock`: mock モードで起動
- `npm run start:local`: local GraphQL モードで起動
- `npm run start:production`: production GraphQL モードで起動

## よくあるトラブル

### 1) `503 Service Unavailable` (high demand)

Gemini 側の一時的高負荷です。時間を空けて再試行してください。

### 2) `Unknown tool`

Gemini が要求したツール名と MCP の定義名が不一致の場合に発生します。
`server.js` のログで要求ツール名を確認し、`src/mcp/schemas/toolSchemas.js` の定義と揃えてください。

### 4) 外部API有効時にエラーになる

`EXTERNAL_API_MODE=local` または `production` のときに `GRAPHQL_API_ENDPOINT` や Token が不足しているとエラーになります。
`.env` の GraphQL 設定を確認してください。

### 3) 画面が更新されない

`src/` を変更した場合、`npm run build` を実行して `public/` へ反映してください。
`npm start` は `public/` を配信します。

## 補足

- API呼び出しは `src/services/chatApi.js` に集約しています。
- `server.js` はリトライ処理、ツール呼び出しループ制御、未知ツール防御を持っています。
- MCPサーバーはツール名を固定したまま、内部実装をモック/外部APIで切り替えられます。
