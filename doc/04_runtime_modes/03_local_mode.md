# Local Mode

## 用途

- ローカル GraphQL サーバーの接続確認をしたいとき
- 未実装 API が一部残っていても画面全体を確認したいとき

## 構成

- `createExternalApiGateway()` は `createMixedGateway()` を返す
- primary data source は external
- fallback data source は mock

## mixed-local の意味

local は単純な external 専用ではありません。`EXTERNAL_API_NOT_IMPLEMENTED`
を返したメソッドだけ mock にフォールバックします。

### 使い分け

- GraphQL 実装があるメソッド: external を使う
- 未実装メソッド: mock にフォールバックする
- GraphQL の HTTP エラー / timeout / shape エラー: mock に逃がさずエラーを返す

つまり fallback 条件は「未実装エラーコード」のみです。

## 確認手順

1. ローカル GraphQL サーバーを起動
2. `npm run start:local`
3. `/api/dev/external-target` で endpoint を確認
4. `/api/dev/graphql-probe` で employee / recipe / item を直接確認
5. `/api/dev/mcp-runtime-diagnostics` で子プロセスの mode と endpoint を確認
6. 顧客情報、カート、注文、お気に入りを UI から確認

## 注意点

- local で画面が動いても、一部は mock フォールバックの可能性がある
- production readiness の判断には local 単独では不十分

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- mode 解決ルール: [01_mode_resolution.md](01_mode_resolution.md)
- production の条件: [04_production_mode.md](04_production_mode.md)