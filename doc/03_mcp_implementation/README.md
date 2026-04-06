# 03 MCP Implementation

この章では、MCP クライアント / サーバー、tool registry、Gemini Function Calling 連携を整理します。

## Overview Diagram

```mermaid
sequenceDiagram
	participant UI as Frontend
	participant API as Express
	participant G as Gemini
	participant MC as MCP Client
	participant MS as MCP Server
	participant UC as Usecase
	participant GW as Gateway
	UI->>API: POST /api/chat
	API->>MC: listTools()
	API->>G: prompt + tool schemas
	G-->>API: function call request
	API->>MC: callTool(name, args)
	MC->>MS: CallToolRequest
	MS->>UC: execute handler
	UC->>GW: fetch business data
	GW-->>UC: result
	UC-->>MS: JSON result
	MS-->>MC: tool response
	MC-->>API: parsed result
	API->>G: functionResponse
	G-->>API: final answer
	API-->>UI: response payload
```

## 文書一覧

- [01_server_and_client.md](01_server_and_client.md): 親子プロセスと MCP 接続
- [02_tool_registry.md](02_tool_registry.md): tool 定義、schema、handler 解決
- [03_function_calling.md](03_function_calling.md): Gemini 連携、リトライ、ループ防止、runtime diagnostics

## この章の目的

- Express 親プロセスと MCP 子プロセスの分離を理解する
- tool registry ベースの実装理由を把握する
- チャット時にツールがどう呼ばれるかを追えるようにする