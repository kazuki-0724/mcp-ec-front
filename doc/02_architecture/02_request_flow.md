# Request Flow

## チャット経路

1. フロントエンドが `/api/chat` に prompt と conversationHistory を送る
2. 親プロセスが MCP の tool 一覧を取得する
3. tool 一覧を Gemini の functionDeclarations に変換する
4. Gemini が function call を返したら、親プロセスが MCP 子プロセスへ callTool する
5. 子プロセスが usecase を実行し、結果を JSON 文字列で返す
6. 親プロセスがその結果を Gemini に functionResponse として返す
7. Gemini が最終テキストを生成し、HTTP レスポンスを返す

## 直接ツール実行経路

Commerce 系 UI は `/api/mcp/tool` を使って、Gemini を介さずに MCP ツールを直接呼びます。これにより、EC UI の検証とデバッグがしやすくなっています。

## 開発補助 API

- `/api/dev/external-target`: 現在の mode と endpoint を確認する
- `/api/dev/mcp-runtime-diagnostics`: 親子プロセスの runtime 設定を確認する
- `/api/dev/graphql-probe`: 親プロセスから GraphQL に直接 probe する

## 設計上の要点

- Gemini は直接データアクセスせず、必ず MCP ツール経由で情報を取得する
- tool 定義と handler 解決は registry に集約する
- mode 切り替えは gateway 層に閉じ込める