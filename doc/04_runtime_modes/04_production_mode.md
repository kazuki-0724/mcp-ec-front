# Production Mode

## 用途

- 外部 GraphQL API を正式なデータ取得元として使うとき

## 構成

- `createExternalApiGateway()` は external data source 単体を使う
- mock フォールバックは使わない

## 前提条件

1. `GRAPHQL_API_ENDPOINT` が正しい
2. 必要なら `GRAPHQL_API_TOKEN` が正しい
3. `GRAPHQL_API_USER_ID` が適切に設定されている
4. GraphQL サーバーが API リファレンスどおりに実装されている
5. 戻り値の field 名と shape が wrapper の期待と一致している

`EXTERNAL_API_MODE=production` で `GRAPHQL_API_ENDPOINT` が空の場合、
起動時にエラーで停止します。

## 推奨確認手順

1. `npm run start:production`
2. `/api/dev/external-target` で `mode=production` と endpoint を確認
3. `/api/dev/mcp-runtime-diagnostics` で `gatewaySelection=external` を確認
4. 商品検索、顧客情報、カート mutation、注文履歴まで一通り実行する

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- mode 解決ルール: [01_mode_resolution.md](01_mode_resolution.md)
- GraphQL 契約: [../05_api_reference/README.md](../05_api_reference/README.md)

## 机上で言えること

production は endpoint と実装が揃っていれば成立します。ただし local と違って mock フォールバックがないため、未実装 query / mutation が 1 つでも残っているとその機能はそのまま失敗します。