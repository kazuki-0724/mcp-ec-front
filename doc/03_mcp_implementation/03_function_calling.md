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

`conversationHistory` はそのまま渡さず、次のルールで整形されます。

- 最新 8 ターンに限定
- `userPrompt` / `assistantResponse` を長さ制限つきでトリム
- `toolExecutions` は 1 ターン最大 6 件まで保持
- 空ターンは除外

この整形により、履歴肥大化と不正フォーマットの混入を防ぎます。

## ループ防止

同じ tool 名と同じ引数の組み合わせが繰り返された場合は、中断して無限ループを避けます。

判定は `toolName + JSON.stringify(args)` のシグネチャ単位で行われます。

## リトライ

429、503、high demand 系の Gemini エラーは指数バックオフで再試行します。

既定値は `maxRetries=3`、`baseDelayMs=800` です。

## Runtime Diagnostics

`get_runtime_diagnostics` は、子プロセスがどの mode / endpoint / env を使っているか確認するためのツールです。

代表的な出力:

- `externalApiMode`
- `gatewaySelection`
- `externalApi.endpoint`
- `envSnapshot.EXTERNAL_API_MODE`
- `envSnapshot.GRAPHQL_API_ENDPOINT`

親プロセスの `/api/dev/mcp-runtime-diagnostics` と組み合わせると、親子の設定ずれを確認できます。

## 例外時と最終レスポンス

- Gemini が未知ツールを要求した場合: error を含む functionResponse を返して継続
- tool 実行結果は `toolExecutions` として HTTP レスポンスに同梱
- 最終テキストが空の場合は、tool 結果を連結した fallback 文面を返す

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- 親子接続: [01_server_and_client.md](01_server_and_client.md)
- registry 詳細: [02_tool_registry.md](02_tool_registry.md)