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

外部API連携を有効化する場合は、次も設定してください。

```env
USE_EXTERNAL_APIS=true

EXTERNAL_API_TIMEOUT_MS=4000
EXTERNAL_API_RETRY_COUNT=2
EXTERNAL_API_RETRY_DELAY_MS=300

EMPLOYEE_API_BASE_URL=https://example.com
EMPLOYEE_API_TOKEN=your_employee_api_token

RECIPE_API_BASE_URL=https://example.com
RECIPE_API_TOKEN=your_recipe_api_token

ITEM_API_BASE_URL=https://example.com
ITEM_API_TOKEN=your_item_api_token
```

`USE_EXTERNAL_APIS=false`（または未設定）の場合はモックデータを使って動作します。

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

## 開発時のコマンド

- `npm run dev`: Vite 開発サーバー起動
- `npm run build`: 本番向けビルド (`public/` 出力)
- `npm run preview`: ビルド結果のプレビュー
- `npm start`: Express サーバー起動

## よくあるトラブル

### 1) `503 Service Unavailable` (high demand)

Gemini 側の一時的高負荷です。時間を空けて再試行してください。

### 2) `Unknown tool`

Gemini が要求したツール名と MCP の定義名が不一致の場合に発生します。
`server.js` のログで要求ツール名を確認し、`src/mcp/schemas/toolSchemas.js` の定義と揃えてください。

### 4) 外部API有効時にエラーになる

`USE_EXTERNAL_APIS=true` のときに Base URL や Token が不足しているとエラーになります。
`.env` の外部API設定を確認してください。

### 3) 画面が更新されない

`src/` を変更した場合、`npm run build` を実行して `public/` へ反映してください。
`npm start` は `public/` を配信します。

## 補足

- API呼び出しは `src/services/chatApi.js` に集約しています。
- `server.js` はリトライ処理、ツール呼び出しループ制御、未知ツール防御を持っています。
- MCPサーバーはツール名を固定したまま、内部実装をモック/外部APIで切り替えられます。
