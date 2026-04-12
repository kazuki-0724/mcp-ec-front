# Tool Registry

## 概要

MCP の tool 定義は `src/mcp/registry/toolRegistry.js` に集約されています。

各 tool 定義は次を持ちます。

- `name`
- `description`
- `inputSchema`
- `handlerName`

`handlerName` は usecase 名との対応キーで、MCP 公開定義そのものには
含めません。`listTools()` で返すときは `handlerName` を除外した
定義 (`name/description/inputSchema`) を返します。

## なぜ registry にしているか

- schema と handler の対応漏れを防ぐため
- rename 時の影響範囲を局所化するため
- listTools と callTool で同じ定義元を使うため

## MCP サーバー側の使い方

`src/mcp/server.js` は `createToolRegistry({ usecases })` から registry を受け取り、次の 2 つに使います。

- `ListToolsRequestSchema`: 公開 tool 定義を返す
- `CallToolRequestSchema`: `toolName` から handler を解決して実行する

`createToolRegistry({ usecases })` は内部的に
`tool.name -> { ...tool, handler: usecases[tool.handlerName] }` の map を構築し、
call 時はこの `handler` を使って実行します。

## エラー処理

- 未知の tool は `MCP_UNKNOWN_TOOL`
- handler 実行例外は `toAppError()` で正規化
- 返り値は JSON 文字列として `content[].text` に入る

ツール実行例外では `code` と `error` を JSON で返すため、
親プロセス側はその文字列を parse して UI へ中継できます。

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- 親子接続: [01_server_and_client.md](01_server_and_client.md)
- function calling: [03_function_calling.md](03_function_calling.md)