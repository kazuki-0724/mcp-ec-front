# GraphQL Integration

## 実装の中心

GraphQL 呼び出しの中心は `src/gateways/external/createGraphqlCommerceApis.js` です。

このモジュールは次を担当します。

- HTTP ヘッダーの組み立て
- query / mutation の送信
- GraphQL error の AppError 化
- mock データソース相当の責務ごとの wrapper 提供

## 主な対応関係

- `getEmployeeInfo` → `employeeById`
- `getRecipeByKeyword` → `recipeByKeyword`
- `getItemInfoById` → `itemById`
- `listProducts` → `products`
- `getProduct` → `productById`
- `listCategories` → `categories`
- `listBrands` → `brands`
- `listCoupons` → `coupons`
- `getCustomerProfile` → `customerProfile`
- `getLoyaltySummary` → `loyaltySummary`
- `getWishlist` → `wishlist`
- `addItemToWishlist` → `addItemToWishlist`
- `listOrders` → `orderHistory`
- `getOrder` → `orderById`
- `getProductReviews` → `productReviews`
- `getPaymentMethods` → `paymentMethods`
- `getReturnPolicy` → `returnPolicy`
- `getDeliverySlots` → `deliverySlots`
- `getCart` → `currentCart`
- `addItemToCart` → `addItemToCart`
- `updateCartItemQuantity` → `updateCartItemQuantity`
- `removeItemFromCart` → `removeItemFromCart`
- `applyCouponToCart` → `applyCouponToCart`
- `getFeaturedProducts` → `featuredProducts`
- `getRecommendedProducts` → `recommendedProducts`

## External Data Source Adapter

`src/gateways/external/createExternalDataSource.js` は、GraphQL wrapper の戻り値を `createCommerceGateway()` が期待する dataSource shape に変換します。

### 主な正規化

- 商品詳細を gateway 互換の Product shape に変換
- cart を raw cart 形へ変換
- wishlist の `items: Product[]` を `itemId[]` に変換
- featured / recommended の `Product[]` を `itemId[]` に変換

## cart と wishlist

cart と wishlist は read だけでなく更新があるため、GraphQL 側では mutation を使います。`createCommerceGateway()` は cart mutation 用メソッドがあればそれを優先し、なければ raw cart 読み書きに戻ります。

## エラー処理

GraphQL レスポンスに `errors` 配列がある場合、wrapper は `EXTERNAL_GRAPHQL_ERROR` を投げます。production ではこのエラーがそのまま顕在化します。