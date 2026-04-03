function defineTool(name, description, properties = {}, required = []) {
    return {
        name,
        description,
        inputSchema: {
            type: "object",
            properties,
            required
        }
    };
}

const itemIdProperty = { type: "string", description: "商品ID (例: G001)" };
const customerIdProperty = { type: "string", description: "顧客ID (例: C001)" };
const limitProperty = { type: "number", description: "返却件数の上限" };

export const TOOL_DEFINITIONS = [
    defineTool("get_runtime_diagnostics", "MCP子プロセスの実行時設定（mode、endpoint、関連環境変数の安全なスナップショット）を返します。"),
    defineTool("get_employee_info", "社員IDから、その社員の名前と所属部署を取得します。", {
        employeeId: { type: "string", description: "社員ID (例: E001)" }
    }, ["employeeId"]),
    defineTool("get_recipe_by_keyword", "レシピキーワードからレシピ情報と必要具材情報を返します。具材の itemId は別ツールで商品詳細取得に使います。", {
        keyword: { type: "string", description: "レシピを特定するキーワード (例: カレー)" }
    }, ["keyword"]),
    defineTool("get_item_info_by_id", "商品IDから商品情報（商品名、単価、単位、在庫）を取得します。", {
        itemId: itemIdProperty
    }, ["itemId"]),
    defineTool("search_products", "商品をキーワード・カテゴリ・ブランドで検索します。", {
        query: { type: "string", description: "検索キーワード" },
        categoryId: { type: "string", description: "カテゴリID" },
        brandId: { type: "string", description: "ブランドID" },
        limit: limitProperty
    }),
    defineTool("get_product_details", "商品詳細を取得します。", {
        itemId: itemIdProperty
    }, ["itemId"]),
    defineTool("list_categories", "ECサイトの商品カテゴリ一覧を返します。"),
    defineTool("get_category_products", "カテゴリ配下の商品一覧を返します。", {
        categoryId: { type: "string", description: "カテゴリID" },
        limit: limitProperty
    }, ["categoryId"]),
    defineTool("list_brands", "取り扱いブランド一覧を返します。"),
    defineTool("get_brand_products", "ブランド配下の商品一覧を返します。", {
        brandId: { type: "string", description: "ブランドID" },
        limit: limitProperty
    }, ["brandId"]),
    defineTool("get_featured_products", "トップ掲載用の注目商品一覧を返します。", {
        limit: limitProperty
    }),
    defineTool("get_recommended_products", "顧客属性または商品起点でおすすめ商品を返します。", {
        customerId: customerIdProperty,
        basedOnItemId: itemIdProperty,
        limit: limitProperty
    }),
    defineTool("get_price_quote", "単一商品の見積価格を返します。", {
        itemId: itemIdProperty,
        quantity: { type: "number", description: "数量" },
        customerTier: { type: "string", description: "会員ランク (bronze/silver/gold)" }
    }, ["itemId"]),
    defineTool("get_bulk_price_quote", "複数商品のまとめ見積を返します。", {
        items: {
            type: "array",
            description: "見積対象の商品配列",
            items: {
                type: "object",
                properties: {
                    itemId: itemIdProperty,
                    quantity: { type: "number", description: "数量" }
                },
                required: ["itemId", "quantity"]
            }
        },
        customerTier: { type: "string", description: "会員ランク" },
        couponCode: { type: "string", description: "適用クーポンコード" }
    }, ["items"]),
    defineTool("get_inventory_status", "商品の在庫状況を返します。", {
        itemId: itemIdProperty
    }, ["itemId"]),
    defineTool("get_cart", "現在のカート状態を返します。"),
    defineTool("add_item_to_cart", "商品をカートに追加します。", {
        itemId: itemIdProperty,
        quantity: { type: "number", description: "追加数量" }
    }, ["itemId"]),
    defineTool("update_cart_item_quantity", "カート内商品の数量を更新します。0 を指定すると削除扱いです。", {
        itemId: itemIdProperty,
        quantity: { type: "number", description: "更新後数量" }
    }, ["itemId", "quantity"]),
    defineTool("remove_item_from_cart", "商品をカートから削除します。", {
        itemId: itemIdProperty
    }, ["itemId"]),
    defineTool("apply_coupon_to_cart", "クーポンをカートに適用します。", {
        couponCode: { type: "string", description: "クーポンコード" }
    }, ["couponCode"]),
    defineTool("get_available_coupons", "会員ランクに応じた利用可能クーポンを返します。", {
        customerTier: { type: "string", description: "会員ランク" }
    }),
    defineTool("estimate_shipping_fee", "配送先と配送方法から送料見積を返します。", {
        postalCode: { type: "string", description: "郵便番号7桁" },
        prefecture: { type: "string", description: "都道府県" },
        shippingMethod: { type: "string", description: "配送方法 (standard/express)" },
        cartTotal: { type: "number", description: "商品合計金額" }
    }, ["postalCode", "prefecture"]),
    defineTool("get_delivery_slots", "配送可能な時間帯を返します。", {
        postalCode: { type: "string", description: "郵便番号7桁" },
        prefecture: { type: "string", description: "都道府県" }
    }, ["postalCode", "prefecture"]),
    defineTool("validate_shipping_address", "配送先住所の形式妥当性をチェックします。", {
        postalCode: { type: "string", description: "郵便番号7桁" },
        prefecture: { type: "string", description: "都道府県" },
        city: { type: "string", description: "市区町村" },
        line1: { type: "string", description: "番地・建物名の先頭行" },
        line2: { type: "string", description: "建物名・部屋番号" }
    }, ["postalCode", "prefecture", "city", "line1"]),
    defineTool("get_customer_profile", "顧客プロフィールを返します。", {
        customerId: customerIdProperty
    }, ["customerId"]),
    defineTool("get_loyalty_summary", "顧客の会員ランク・ポイント情報を返します。", {
        customerId: customerIdProperty
    }, ["customerId"]),
    defineTool("get_wishlist", "顧客のお気に入り商品一覧を返します。", {
        customerId: customerIdProperty
    }, ["customerId"]),
    defineTool("add_item_to_wishlist", "商品をお気に入りに追加します。", {
        customerId: customerIdProperty,
        itemId: itemIdProperty
    }, ["customerId", "itemId"]),
    defineTool("get_order_history", "顧客の注文履歴を返します。", {
        customerId: customerIdProperty,
        limit: limitProperty
    }, ["customerId"]),
    defineTool("get_order_details", "注文詳細を返します。", {
        orderId: { type: "string", description: "注文ID (例: O1001)" }
    }, ["orderId"]),
    defineTool("get_product_reviews", "商品のレビューを返します。", {
        itemId: itemIdProperty,
        limit: limitProperty
    }, ["itemId"]),
    defineTool("get_payment_methods", "利用可能な決済手段一覧を返します。"),
    defineTool("get_return_policy", "返品ポリシーを返します。カテゴリ指定時はカテゴリ別ルールを優先します。", {
        categoryId: { type: "string", description: "カテゴリID" }
    })
];
