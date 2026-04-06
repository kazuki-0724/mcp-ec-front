# Installation

## 前提

- Node.js が利用できること
- npm が利用できること
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

## フロントビルド

このプロジェクトは `public/` を Express から配信します。`src/` を更新したらビルドが必要です。

```bash
npm run build
```

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