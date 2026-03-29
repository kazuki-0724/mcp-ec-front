export const TOOL_DEFINITIONS = [
    {
        name: "get_employee_info",
        description: "社員IDから、その社員の名前と所属部署を取得します。",
        inputSchema: {
            type: "object",
            properties: {
                employeeId: { type: "string", description: "社員ID (例: E001)" }
            },
            required: ["employeeId"]
        }
    },
    {
        name: "get_recipe_by_keyword",
        description: "レシピキーワードからレシピ情報と必要具材情報を返します。具材の itemId は別ツールで商品詳細取得に使います。",
        inputSchema: {
            type: "object",
            properties: {
                keyword: { type: "string", description: "レシピを特定するキーワード (例: カレー)" }
            },
            required: ["keyword"]
        }
    },
    {
        name: "get_item_info_by_id",
        description: "商品IDから商品情報（商品名、単価、単位、在庫）を取得します。",
        inputSchema: {
            type: "object",
            properties: {
                itemId: { type: "string", description: "商品ID (例: G001)" }
            },
            required: ["itemId"]
        }
    }
];
