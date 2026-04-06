# Tool Registry

## 概要

MCP の tool 定義は `src/mcp/registry/toolRegistry.js` に集約されています。

各 tool 定義は次を持ちます。

- `name`
- `description`
- `inputSchema`
- `handlerName`

## なぜ registry にしているか

- schema と handler の対応漏れを防ぐため
- rename 時の影響範囲を局所化するため
- listTools と callTool で同じ定義元を使うため

## MCP サーバー側の使い方

`src/mcp/server.js` は `createToolRegistry({ usecases })` から registry を受け取り、次の 2 つに使います。

- `ListToolsRequestSchema`: 公開 tool 定義を返す
- `CallToolRequestSchema`: `toolName` から handler を解決して実行する

## エラー処理

- 未知の tool は `MCP_UNKNOWN_TOOL`
- handler 実行例外は `toAppError()` で正規化
- 返り値は JSON 文字列として `content[].text` に入る