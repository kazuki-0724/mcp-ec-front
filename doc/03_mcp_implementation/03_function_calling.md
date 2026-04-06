# Function Calling

## Gemini 連携の中心

`src/server/chat/createChatController.js` が Gemini Function Calling のオーケストレーションを担います。

## 処理手順

1. conversationHistory を sanitize する
2. MCP から tool 一覧を取得する
3. Gemini の functionDeclarations を構築する
4. prompt を送る
5. functionCalls が返ったら順に MCP ツールを呼ぶ
6. 結果を functionResponse として Gemini に返す
7. 最大 5 ラウンド繰り返す
8. 最終テキストを返す

## ループ防止

同じ tool 名と同じ引数の組み合わせが繰り返された場合は、中断して無限ループを避けます。

## リトライ

429、503、high demand 系の Gemini エラーは指数バックオフで再試行します。

## Runtime Diagnostics

`get_runtime_diagnostics` は、子プロセスがどの mode / endpoint / env を使っているか確認するためのツールです。

代表的な出力:

- `externalApiMode`
- `gatewaySelection`
- `externalApi.endpoint`
- `envSnapshot.EXTERNAL_API_MODE`
- `envSnapshot.GRAPHQL_API_ENDPOINT`

親プロセスの `/api/dev/mcp-runtime-diagnostics` と組み合わせると、親子の設定ずれを確認できます。