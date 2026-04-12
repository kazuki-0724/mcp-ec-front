# 02 Architecture

この章では、プロジェクト全体の構成と責務分離を説明します。

## Overview Diagram

```mermaid
flowchart TD
  UI[Vue UI] --> API[Express API]
  API --> Chat[/api/chat/]
  API --> Tool[/api/mcp/tool/]
  Chat --> Gemini[Gemini]
  Gemini --> MCPClient[MCP client]
  Tool --> MCPClient
  MCPClient --> MCPServer[MCP server child process]
  MCPServer --> Usecases[Usecases]
  Usecases --> Gateway[Commerce gateway]
  Gateway --> Mock[mock data source]
  Gateway --> External[external GraphQL data source]
```

この章における `external` は「外部 GraphQL サービスとその接続アダプタ群」を指します。

## 文書一覧

- [01_system_overview.md](01_system_overview.md): システム全体像と主要コンポーネント
- [02_request_flow.md](02_request_flow.md): チャット経路、直接ツール実行経路、補助 API

## この章の目的

- UI、Express、MCP、Usecase、Gateway の境界を把握する
- どこで mode 解決と親子プロセス引き継ぎが行われるかを理解する
- GraphQL と mock の責務差し替え点を把握する

## 次の章

- MCP 実装の詳細: [../03_mcp_implementation/README.md](../03_mcp_implementation/README.md)
- runtime mode の詳細: [../04_runtime_modes/README.md](../04_runtime_modes/README.md)