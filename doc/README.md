# Documentation Index

このディレクトリは、章立てされたプロジェクトドキュメントのルートです。README は全体の入口として使い、詳細は各章ディレクトリへ分割しています。

## 章構成

- [01_getting_started/README.md](01_getting_started/README.md): 導入、インストール、設定
- [02_architecture/README.md](02_architecture/README.md): 全体構成、レイヤー責務、実行フロー
- [03_mcp_implementation/README.md](03_mcp_implementation/README.md): MCP クライアント / サーバー、tool registry、Function Calling
- [04_runtime_modes/README.md](04_runtime_modes/README.md): mock / local / production の切り替えと運用観点
- [05_api_reference/README.md](05_api_reference/README.md): GraphQL 連携と API 仕様
- [assets/README.md](assets/README.md): ドキュメント用共通リソース

## 推奨の読み順

1. [01_getting_started/README.md](01_getting_started/README.md)
2. [02_architecture/README.md](02_architecture/README.md)
3. [03_mcp_implementation/README.md](03_mcp_implementation/README.md)
4. [04_runtime_modes/README.md](04_runtime_modes/README.md)
5. [05_api_reference/README.md](05_api_reference/README.md)

## この構成の意図

- README を章の入口に限定する
- 導入と実装詳細を明確に分離する
- MCP と mode 切り替えを独立した章として追いやすくする
- API 仕様を実装ガイドと分けて整理する