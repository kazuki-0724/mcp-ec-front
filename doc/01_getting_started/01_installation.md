# Installation

## 前提

- Node.js 16 以上が利用できること
- npm 7 以上が利用できること
- Gemini API キーを取得済みであること

## 依存インストール

```bash
npm install
```

## Gemini API キー設定

ルートの `.env` に最低限次を設定します。

```env
GEMINI_API_KEY=your_api_key_here
```

## env ファイル戦略

起動時は、`package.json` の script で `.env` と `env/.env.<mode>` を順に読み込みます。

- `.env`: 全モード共通の設定 (例: `GEMINI_API_KEY`)
- `env/.env.mock` / `env/.env.local` / `env/.env.production`: モード別の上書き設定

実行時は後で読み込まれた値が優先されるため、共通設定は `.env`、
モード差分は `env/.env.<mode>` に置くと管理しやすくなります。

## フロントビルド

このプロジェクトは `public/` を Express から配信します。`src/` を更新したらビルドが必要です。

```bash
npm run build
```

### Windows ユーザー向け

Windows で PowerShell の実行ポリシーにより `npm.ps1` がブロックされる場合は、次を使ってください。

```bash
cmd /c npm run build
```

## 起動

### mock モード

```bash
npm run start:mock
```

### local モード

```bash
npm run start:local
```

### production モード

```bash
npm run start:production
```

起動後は `http://localhost:3000` にアクセスできます。

## 開発時の確認ポイント

- 初回は mock モードで画面表示とチャット動作を確認する
- local モードでは別途 GraphQL サーバーを起動してから動作確認する
- `Developer Console` から external target、GraphQL probe、runtime diagnostics を確認できる

## 次のステップ

- 設定値の詳細を確認: [02_configuration.md](02_configuration.md)
- モード運用の詳細を確認: [../04_runtime_modes/README.md](../04_runtime_modes/README.md)
- システム構成を確認: [../02_architecture/README.md](../02_architecture/README.md)