# Mock Mode

## 用途

- GraphQL サーバーなしで UI とツールを一通り確認したいとき
- チャットと EC 導線の基本動作を最短で確認したいとき

## 構成

- `createExternalApiGateway()` は `createMockGateway()` を返す
- データソースは `src/gateways/mock/createMockDataSource.js`

## 特徴

- 全機能が内蔵 mock データで完結する
- GraphQL endpoint や token は不要
- UI の回帰確認に向いている

## 確認手順

1. `npm run start:mock`
2. `/api/dev/external-target` で mode が `mock` であることを確認
3. チャット、顧客情報、カート、お気に入り、注文履歴を確認

`/api/dev/mcp-runtime-diagnostics` も併用し、子プロセス側の
`externalApiMode=mock` を確認すると親子の設定一致を確認できます。

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- mode 解決ルール: [01_mode_resolution.md](01_mode_resolution.md)
- local との差分: [03_local_mode.md](03_local_mode.md)