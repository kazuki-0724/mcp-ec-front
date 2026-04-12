# Mode Resolution

## モード解決箇所

- 親プロセス側: `src/server/config/externalApiTarget.js`
- 子プロセス側: `src/app/config/env.js`

## ルール

1. `EXTERNAL_API_MODE` があれば最優先
2. 値は `mock` / `local` / `production`
3. 未設定時は `USE_EXTERNAL_APIS` を参照
4. `USE_EXTERNAL_APIS=true` は `production`
5. それ以外は `mock`

`EXTERNAL_API_MODE` の値が無効な場合は、未設定と同様に `USE_EXTERNAL_APIS` 判定へフォールバックします。

## 設定伝播

親プロセスは `buildMcpChildEnv()` を使って、次を子プロセスへ引き継ぎます。

- `EXTERNAL_API_MODE`
- `GRAPHQL_API_ENDPOINT`
- `GRAPHQL_API_USER_ID`
- `GRAPHQL_API_TOKEN`

このため、親の external target と子の runtime diagnostics は原則一致します。

## endpoint の既定値

- local では `GRAPHQL_API_ENDPOINT` 未設定時に `http://localhost:8081/graphql`
- production では明示設定前提

`mock` 以外で endpoint が最終的に空の場合、起動時に
`GRAPHQL_API_ENDPOINT is required when EXTERNAL_API_MODE=<mode>`
エラーで停止します。

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- local の挙動: [03_local_mode.md](03_local_mode.md)
- production の前提: [04_production_mode.md](04_production_mode.md)