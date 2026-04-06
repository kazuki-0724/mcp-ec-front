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

## 推奨確認手順

1. `npm run start:production`
2. `get_runtime_diagnostics` で `gatewaySelection=external` を確認
3. 商品検索、顧客情報、カート mutation、注文履歴まで一通り実行する

## 机上で言えること

production は endpoint と実装が揃っていれば成立します。ただし local と違って mock フォールバックがないため、未実装 query / mutation が 1 つでも残っているとその機能はそのまま失敗します。