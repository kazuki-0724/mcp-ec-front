function defineTool({ name, description, inputSchema = { type: 'object', properties: {}, required: [] }, handlerName = name }) {
  return {
    name,
    description,
    inputSchema,
    handlerName
  };
}

const itemIdProperty = { type: 'string', description: '商品ID (例: G001)' };
const customerIdProperty = { type: 'string', description: '顧客ID (例: C001)' };
const limitProperty = { type: 'number', description: '返却件数の上限' };

export const TOOL_REGISTRY = [
  defineTool({ name: 'get_runtime_diagnostics', description: 'MCP子プロセスの実行時設定（mode、endpoint、関連環境変数の安全なスナップショット）を返します。' }),
  defineTool({ name: 'get_employee_info', description: '社員IDから、その社員の名前と所属部署を取得します。', inputSchema: { type: 'object', properties: { employeeId: { type: 'string', description: '社員ID (例: E001)' } }, required: ['employeeId'] } }),
  defineTool({ name: 'get_recipe_by_keyword', description: 'レシピキーワードからレシピ情報と必要具材情報を返します。具材の itemId は別ツールで商品詳細取得に使います。', inputSchema: { type: 'object', properties: { keyword: { type: 'string', description: 'レシピを特定するキーワード (例: カレー)' } }, required: ['keyword'] } }),
  defineTool({ name: 'get_item_info_by_id', description: '商品IDから商品情報（商品名、単価、単位、在庫）を取得します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty }, required: ['itemId'] } }),
  defineTool({ name: 'search_products', description: '商品をキーワード・カテゴリ・ブランドで検索します。', inputSchema: { type: 'object', properties: { query: { type: 'string', description: '検索キーワード' }, categoryId: { type: 'string', description: 'カテゴリID' }, brandId: { type: 'string', description: 'ブランドID' }, limit: limitProperty }, required: [] } }),
  defineTool({ name: 'get_product_details', description: '商品詳細を取得します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty }, required: ['itemId'] } }),
  defineTool({ name: 'list_categories', description: 'ECサイトの商品カテゴリ一覧を返します。' }),
  defineTool({ name: 'get_category_products', description: 'カテゴリ配下の商品一覧を返します。', inputSchema: { type: 'object', properties: { categoryId: { type: 'string', description: 'カテゴリID' }, limit: limitProperty }, required: ['categoryId'] } }),
  defineTool({ name: 'list_brands', description: '取り扱いブランド一覧を返します。' }),
  defineTool({ name: 'get_brand_products', description: 'ブランド配下の商品一覧を返します。', inputSchema: { type: 'object', properties: { brandId: { type: 'string', description: 'ブランドID' }, limit: limitProperty }, required: ['brandId'] } }),
  defineTool({ name: 'get_featured_products', description: 'トップ掲載用の注目商品一覧を返します。', inputSchema: { type: 'object', properties: { limit: limitProperty }, required: [] } }),
  defineTool({ name: 'get_recommended_products', description: '顧客属性または商品起点でおすすめ商品を返します。', inputSchema: { type: 'object', properties: { customerId: customerIdProperty, basedOnItemId: itemIdProperty, limit: limitProperty }, required: [] } }),
  defineTool({ name: 'get_price_quote', description: '単一商品の見積価格を返します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty, quantity: { type: 'number', description: '数量' }, customerTier: { type: 'string', description: '会員ランク (bronze/silver/gold)' } }, required: ['itemId'] } }),
  defineTool({ name: 'get_bulk_price_quote', description: '複数商品のまとめ見積を返します。', inputSchema: { type: 'object', properties: { items: { type: 'array', description: '見積対象の商品配列', items: { type: 'object', properties: { itemId: itemIdProperty, quantity: { type: 'number', description: '数量' } }, required: ['itemId', 'quantity'] } }, customerTier: { type: 'string', description: '会員ランク' }, couponCode: { type: 'string', description: '適用クーポンコード' } }, required: ['items'] } }),
  defineTool({ name: 'get_inventory_status', description: '商品の在庫状況を返します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty }, required: ['itemId'] } }),
  defineTool({ name: 'get_cart', description: '現在のカート状態を返します。' }),
  defineTool({ name: 'add_item_to_cart', description: '商品をカートに追加します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty, quantity: { type: 'number', description: '追加数量' } }, required: ['itemId'] } }),
  defineTool({ name: 'update_cart_item_quantity', description: 'カート内商品の数量を更新します。0 を指定すると削除扱いです。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty, quantity: { type: 'number', description: '更新後数量' } }, required: ['itemId', 'quantity'] } }),
  defineTool({ name: 'remove_item_from_cart', description: '商品をカートから削除します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty }, required: ['itemId'] } }),
  defineTool({ name: 'apply_coupon_to_cart', description: 'クーポンをカートに適用します。', inputSchema: { type: 'object', properties: { couponCode: { type: 'string', description: 'クーポンコード' } }, required: ['couponCode'] } }),
  defineTool({ name: 'get_available_coupons', description: '会員ランクに応じた利用可能クーポンを返します。', inputSchema: { type: 'object', properties: { customerTier: { type: 'string', description: '会員ランク' } }, required: [] } }),
  defineTool({ name: 'estimate_shipping_fee', description: '配送先と配送方法から送料見積を返します。', inputSchema: { type: 'object', properties: { postalCode: { type: 'string', description: '郵便番号7桁' }, prefecture: { type: 'string', description: '都道府県' }, shippingMethod: { type: 'string', description: '配送方法 (standard/express)' }, cartTotal: { type: 'number', description: '商品合計金額' } }, required: ['postalCode', 'prefecture'] } }),
  defineTool({ name: 'get_delivery_slots', description: '配送可能な時間帯を返します。', inputSchema: { type: 'object', properties: { postalCode: { type: 'string', description: '郵便番号7桁' }, prefecture: { type: 'string', description: '都道府県' } }, required: ['postalCode', 'prefecture'] } }),
  defineTool({ name: 'validate_shipping_address', description: '配送先住所の形式妥当性をチェックします。', inputSchema: { type: 'object', properties: { postalCode: { type: 'string', description: '郵便番号7桁' }, prefecture: { type: 'string', description: '都道府県' }, city: { type: 'string', description: '市区町村' }, line1: { type: 'string', description: '番地・建物名の先頭行' }, line2: { type: 'string', description: '建物名・部屋番号' } }, required: ['postalCode', 'prefecture', 'city', 'line1'] } }),
  defineTool({ name: 'get_customer_profile', description: '顧客プロフィールを返します。', inputSchema: { type: 'object', properties: { customerId: customerIdProperty }, required: ['customerId'] } }),
  defineTool({ name: 'get_loyalty_summary', description: '顧客の会員ランク・ポイント情報を返します。', inputSchema: { type: 'object', properties: { customerId: customerIdProperty }, required: ['customerId'] } }),
  defineTool({ name: 'get_wishlist', description: '顧客のお気に入り商品一覧を返します。', inputSchema: { type: 'object', properties: { customerId: customerIdProperty }, required: ['customerId'] } }),
  defineTool({ name: 'add_item_to_wishlist', description: '商品をお気に入りに追加します。', inputSchema: { type: 'object', properties: { customerId: customerIdProperty, itemId: itemIdProperty }, required: ['customerId', 'itemId'] } }),
  defineTool({ name: 'get_order_history', description: '顧客の注文履歴を返します。', inputSchema: { type: 'object', properties: { customerId: customerIdProperty, limit: limitProperty }, required: ['customerId'] } }),
  defineTool({ name: 'get_order_details', description: '注文詳細を返します。', inputSchema: { type: 'object', properties: { orderId: { type: 'string', description: '注文ID (例: O1001)' } }, required: ['orderId'] } }),
  defineTool({ name: 'get_product_reviews', description: '商品のレビューを返します。', inputSchema: { type: 'object', properties: { itemId: itemIdProperty, limit: limitProperty }, required: ['itemId'] } }),
  defineTool({ name: 'get_payment_methods', description: '利用可能な決済手段一覧を返します。' }),
  defineTool({ name: 'get_return_policy', description: '返品ポリシーを返します。カテゴリ指定時はカテゴリ別ルールを優先します。', inputSchema: { type: 'object', properties: { categoryId: { type: 'string', description: 'カテゴリID' } }, required: [] } })
];

export function getToolDefinitions() {
  return TOOL_REGISTRY.map(({ handlerName, ...toolDefinition }) => toolDefinition);
}

export function createToolRegistry({ usecases }) {
  const toolMap = new Map(
    TOOL_REGISTRY.map((tool) => [tool.name, {
      ...tool,
      handler: usecases[tool.handlerName]
    }])
  );

  return {
    listDefinitions() {
      return getToolDefinitions();
    },
    get(toolName) {
      return toolMap.get(toolName) || null;
    }
  };
}