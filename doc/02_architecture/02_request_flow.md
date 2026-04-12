# Request Flow

## チャット経路

1. フロントエンドが `/api/chat` に prompt と conversationHistory を送る
2. 親プロセスが `conversationHistory` をサニタイズして Gemini history へ変換する
3. 親プロセスが MCP の tool 一覧を取得する
4. tool 一覧を Gemini の functionDeclarations に変換する
5. Gemini が function call を返したら、親プロセスが MCP 子プロセスへ callTool する
6. 子プロセスが usecase を実行し、結果を JSON 文字列で返す
7. 親プロセスがその結果を Gemini に functionResponse として返す
8. Gemini が最終テキストを生成し、HTTP レスポンスを返す

Gemini 呼び出しはリトライ対象エラー (429 / 503 等) に対して
指数バックオフで再試行されます。

## 直接ツール実行経路

Commerce 系 UI は `/api/mcp/tool` を使って、Gemini を介さずに MCP ツールを直接呼びます。これにより、EC UI の検証とデバッグがしやすくなっています。

この経路では親プロセスが `name` の基本検証を行い、
存在しないツール名には 400 を返します。

## 開発補助 API

- `/api/dev/external-target`: 現在の mode と endpoint を確認する
- `/api/dev/mcp-runtime-diagnostics`: 親子プロセスの runtime 設定を確認する
- `/api/dev/graphql-probe`: 親プロセスから GraphQL に直接 probe する

## 設計上の要点

- Gemini は直接データアクセスせず、必ず MCP ツール経由で情報を取得する
- tool 定義と handler 解決は registry に集約する
- 同一シグネチャの function call 反復はループ防止で打ち切る
- mode 切り替えは gateway 層に閉じ込める

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- 全体像: [01_system_overview.md](01_system_overview.md)
- MCP 実装詳細: [../03_mcp_implementation/README.md](../03_mcp_implementation/README.md)