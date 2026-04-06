# GraphQL API Spec

## 目的

この文書は、mock データソース相当の責務を external GraphQL API へ置き換えるための仕様整理です。

## 必要な操作一覧

| mock データソースの責務 | GraphQL APIとして必要な操作 | 種別 |
| --- | --- | --- |
| getEmployeeInfo | employeeById | Query |
| getRecipeByKeyword | recipeByKeyword | Query |
| getItemInfoById | itemById | Query |
| listProducts | products | Query |
| getProduct | productById | Query |
| listCategories | categories | Query |
| listBrands | brands | Query |
| listCoupons | coupons, availableCoupons | Query |
| getCustomerProfile | customerProfile | Query |
| getLoyaltySummary | loyaltySummary | Query |
| getWishlistItemIds | wishlist | Query |
| saveWishlistItemIds | addItemToWishlist | Mutation |
| listOrders | orderHistory | Query |
| getOrder | orderById | Query |
| getProductReviews | productReviews | Query |
| getPaymentMethods | paymentMethods | Query |
| getReturnPolicy | returnPolicy | Query |
| getDeliverySlots | deliverySlots | Query |
| getCart | currentCart | Query |
| saveCart | addItemToCart, updateCartItemQuantity, removeItemFromCart, applyCouponToCart | Mutation |
| getFeaturedProductIds | featuredProducts | Query |
| getRecommendationItemIds | recommendedProducts | Query |

## 推奨スキーマ要点

### Query

- `employeeById(employeeId: ID!): Employee`
- `recipeByKeyword(keyword: String!): RecipeSearchResult`
- `itemById(itemId: ID!): ItemBasic`
- `products(query: String, categoryId: ID, brandId: ID, limit: Int): [Product!]!`
- `productById(itemId: ID!): Product`
- `categories: [Category!]!`
- `brands: [Brand!]!`
- `featuredProducts(limit: Int = 6): [Product!]!`
- `recommendedProducts(customerId: ID, basedOnItemId: ID, limit: Int = 6): [Product!]!`
- `coupons: [Coupon!]!`
- `currentCart: Cart!`
- `customerProfile(customerId: ID!): CustomerProfile`
- `loyaltySummary(customerId: ID!): LoyaltySummary`
- `wishlist(customerId: ID!): Wishlist!`
- `orderHistory(customerId: ID!, limit: Int = 5): [OrderSummary!]!`
- `orderById(orderId: ID!): Order`
- `productReviews(itemId: ID!, limit: Int = 5): [ProductReview!]!`
- `paymentMethods: [PaymentMethod!]!`
- `returnPolicy(categoryId: ID): ReturnPolicy!`
- `deliverySlots(postalCode: String!, prefecture: String!): DeliverySlotResult!`

### Mutation

- `addItemToCart(itemId: ID!, quantity: Int = 1): Cart!`
- `updateCartItemQuantity(itemId: ID!, quantity: Int!): Cart!`
- `removeItemFromCart(itemId: ID!): Cart!`
- `applyCouponToCart(couponCode: String!): Cart!`
- `addItemToWishlist(customerId: ID!, itemId: ID!): Wishlist!`

## 互換性要件

1. UI 互換より Gateway 互換を優先する
2. employee / recipe / item は既存 probe と整合する名前を維持する
3. cart や wishlist の更新系は更新後スナップショットを返す
4. cart は単一 currentCart 前提でよい

## 業務ルール

### 価格計算

- gold は 10% 引き
- silver は 5% 引き
- quantity 5 以上で 5% 引き
- quantity 10 以上で 8% 引き
- 会員割引と数量割引の合計は最大 25%

### カート送料

- 小計 3500 以上で送料無料
- それ未満は 550

### クーポン

- `fixed` は固定額値引き
- `percentage` は割合値引き
- subtotal が `minTotal` 未満なら適用しない

### 在庫状態

- stock > 50 は `in_stock`
- stock > 10 は `limited`
- それ以下は `low_stock`
- `low_stock` の `estimatedRestockDays` は 5

## エラー方針

- 入力不備は GraphQL error
- not found は nullable field または GraphQL error
- production 観点では、エラー内容が wrapper から識別できることが望ましい

## 受け入れ条件

1. local で employee / recipe / item が動く
2. 商品検索、商品詳細、カテゴリ、ブランド一覧が取得できる
3. currentCart と 4 つの cart mutation が動く
4. wishlist、orderHistory、orderById が動く
5. featuredProducts と recommendedProducts が動く
6. existing UI が mock 以外でも致命的エラーなく表示できる