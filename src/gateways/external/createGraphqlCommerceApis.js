import { AppError } from "../../shared/errors/AppError.js";

const PRODUCT_FIELDS = `
    itemId
    itemName
    categoryId
    categoryName
    brandId
    brandName
    unitPrice
    unit
    stock
    tags
    description
    featured
    averageRating
    reviewCount
`;

const CART_FIELDS = `
    cartId
    customerId
    couponCode
    items {
        itemId
        itemName
        quantity
        unitPrice
        originalSubtotal
        discountAmount
        subtotal
        appliedDiscountRate
        unit
    }
    summary {
        originalSubtotal
        lineDiscountTotal
        couponDiscount
        subtotal
        shippingFee
        grandTotal
    }
`;

function buildGraphqlHeaders({ token, userId }) {
    const headers = {
        "Content-Type": "application/json",
        "X-User-Id": userId || "mcp-server"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function createQueryExecutor({ httpClient, endpoint, token, userId }) {
    return async function executeQuery({ operationName, query, variables, dataField }) {
        if (!endpoint) {
            throw new AppError("GRAPHQL_API_ENDPOINT is not configured for external API mode", {
                code: "EXTERNAL_API_ENDPOINT_MISSING",
                status: 500
            });
        }

        const response = await httpClient.postJson(endpoint, {
            headers: buildGraphqlHeaders({ token, userId }),
            body: JSON.stringify({
                operationName,
                query,
                variables
            })
        });

        if (Array.isArray(response?.errors) && response.errors.length > 0) {
            throw new AppError(`External GraphQL returned errors for ${operationName}`, {
                code: "EXTERNAL_GRAPHQL_ERROR",
                status: 502,
                details: {
                    operationName,
                    errors: response.errors
                }
            });
        }

        return response?.data?.[dataField] ?? null;
    };
}

export function createGraphqlCommerceApis({ httpClient, endpoint, token, userId }) {
    if (!httpClient) {
        throw new Error("httpClient is required");
    }

    const executeQuery = createQueryExecutor({ httpClient, endpoint, token, userId });

    async function executeMutation({ operationName, mutation, variables, dataField }) {
        return executeQuery({
            operationName,
            query: mutation,
            variables,
            dataField
        });
    }

    return {
        employeeApi: {
            async getEmployeeInfo(employeeId) {
                return executeQuery({
                    operationName: "EmployeeById",
                    query: `
                      query EmployeeById($employeeId: ID!) {
                        employeeById(employeeId: $employeeId) {
                          employeeId
                          name
                          department
                          role
                          email
                        }
                      }
                    `,
                    variables: { employeeId },
                    dataField: "employeeById"
                });
            }
        },
        recipeApi: {
            async getRecipeByKeyword(keyword) {
                return executeQuery({
                    operationName: "RecipeByKeyword",
                    query: `
                      query RecipeByKeyword($keyword: String!) {
                        recipeByKeyword(keyword: $keyword) {
                          keyword
                          nextActionHint
                          recipe {
                            recipeId
                            recipeName
                            servings
                            requiredIngredients {
                              ingredientName
                              requiredQty
                              itemId
                            }
                          }
                        }
                      }
                    `,
                    variables: { keyword },
                    dataField: "recipeByKeyword"
                });
            }
        },
        itemApi: {
            async getItemInfoById(itemId) {
                return executeQuery({
                    operationName: "ItemById",
                    query: `
                      query ItemById($itemId: ID!) {
                        itemById(itemId: $itemId) {
                          itemId
                          itemName
                          categoryId
                          brandId
                          unitPrice
                          unit
                          stock
                          tags
                        }
                      }
                    `,
                    variables: { itemId },
                    dataField: "itemById"
                });
            }
                },
                async listProducts({ query = null, categoryId = null, brandId = null, limit = 100 } = {}) {
                        return executeQuery({
                                operationName: "Products",
                                query: `
                                    query Products($query: String, $categoryId: ID, $brandId: ID, $limit: Int) {
                                        products(query: $query, categoryId: $categoryId, brandId: $brandId, limit: $limit) {
                                            ${PRODUCT_FIELDS}
                                        }
                                    }
                                `,
                                variables: { query, categoryId, brandId, limit },
                                dataField: "products"
                        });
                },
                async getProduct(itemId) {
                        return executeQuery({
                                operationName: "ProductById",
                                query: `
                                    query ProductById($itemId: ID!) {
                                        productById(itemId: $itemId) {
                                            ${PRODUCT_FIELDS}
                                        }
                                    }
                                `,
                                variables: { itemId },
                                dataField: "productById"
                        });
                },
                async listCategories() {
                        return executeQuery({
                                operationName: "Categories",
                                query: `
                                    query Categories {
                                        categories {
                                            categoryId
                                            categoryName
                                            description
                                            productCount
                                        }
                                    }
                                `,
                                variables: {},
                                dataField: "categories"
                        });
                },
                async listBrands() {
                        return executeQuery({
                                operationName: "Brands",
                                query: `
                                    query Brands {
                                        brands {
                                            brandId
                                            brandName
                                            country
                                            productCount
                                        }
                                    }
                                `,
                                variables: {},
                                dataField: "brands"
                        });
                },
                async listCoupons() {
                        return executeQuery({
                                operationName: "Coupons",
                                query: `
                                    query Coupons {
                                        coupons {
                                            couponCode
                                            description
                                            discountType
                                            discountValue
                                            minTotal
                                            eligibleTiers
                                        }
                                    }
                                `,
                                variables: {},
                                dataField: "coupons"
                        });
                },
                async getCustomerProfile(customerId) {
                        return executeQuery({
                                operationName: "CustomerProfile",
                                query: `
                                    query CustomerProfile($customerId: ID!) {
                                        customerProfile(customerId: $customerId) {
                                            customerId
                                            fullName
                                            email
                                            tier
                                            favoriteCategoryIds
                                            defaultAddress {
                                                postalCode
                                                prefecture
                                                city
                                                line1
                                                line2
                                            }
                                        }
                                    }
                                `,
                                variables: { customerId },
                                dataField: "customerProfile"
                        });
                },
                async getLoyaltySummary(customerId) {
                        return executeQuery({
                                operationName: "LoyaltySummary",
                                query: `
                                    query LoyaltySummary($customerId: ID!) {
                                        loyaltySummary(customerId: $customerId) {
                                            customerId
                                            tier
                                            points
                                            nextTier
                                            nextTierRequiredPoints
                                            perks
                                        }
                                    }
                                `,
                                variables: { customerId },
                                dataField: "loyaltySummary"
                        });
                },
                async getWishlist(customerId) {
                        return executeQuery({
                                operationName: "Wishlist",
                                query: `
                                    query Wishlist($customerId: ID!) {
                                        wishlist(customerId: $customerId) {
                                            customerId
                                            items {
                                                ${PRODUCT_FIELDS}
                                            }
                                        }
                                    }
                                `,
                                variables: { customerId },
                                dataField: "wishlist"
                        });
                },
                async addItemToWishlist(customerId, itemId) {
                        return executeMutation({
                                operationName: "AddItemToWishlist",
                                mutation: `
                                    mutation AddItemToWishlist($customerId: ID!, $itemId: ID!) {
                                        addItemToWishlist(customerId: $customerId, itemId: $itemId) {
                                            customerId
                                            items {
                                                ${PRODUCT_FIELDS}
                                            }
                                        }
                                    }
                                `,
                                variables: { customerId, itemId },
                                dataField: "addItemToWishlist"
                        });
                },
                async listOrders(customerId, limit = 50) {
                        return executeQuery({
                                operationName: "OrderHistory",
                                query: `
                                    query OrderHistory($customerId: ID!, $limit: Int) {
                                        orderHistory(customerId: $customerId, limit: $limit) {
                                            orderId
                                            orderedAt
                                            status
                                            total
                                            itemCount
                                        }
                                    }
                                `,
                                variables: { customerId, limit },
                                dataField: "orderHistory"
                        });
                },
                async getOrder(orderId) {
                        return executeQuery({
                                operationName: "OrderById",
                                query: `
                                    query OrderById($orderId: ID!) {
                                        orderById(orderId: $orderId) {
                                            orderId
                                            customerId
                                            orderedAt
                                            status
                                            paymentMethod
                                            shippingFee
                                            discountTotal
                                            total
                                            shippingAddress {
                                                postalCode
                                                prefecture
                                                city
                                                line1
                                                line2
                                            }
                                            items {
                                                itemId
                                                quantity
                                                unitPrice
                                                itemName
                                            }
                                        }
                                    }
                                `,
                                variables: { orderId },
                                dataField: "orderById"
                        });
                },
                async getProductReviews(itemId, limit = 50) {
                        return executeQuery({
                                operationName: "ProductReviews",
                                query: `
                                    query ProductReviews($itemId: ID!, $limit: Int) {
                                        productReviews(itemId: $itemId, limit: $limit) {
                                            reviewId
                                            rating
                                            title
                                            comment
                                            author
                                            createdAt
                                        }
                                    }
                                `,
                                variables: { itemId, limit },
                                dataField: "productReviews"
                        });
                },
                async getPaymentMethods() {
                        return executeQuery({
                                operationName: "PaymentMethods",
                                query: `
                                    query PaymentMethods {
                                        paymentMethods {
                                            code
                                            label
                                            fees
                                        }
                                    }
                                `,
                                variables: {},
                                dataField: "paymentMethods"
                        });
                },
                async getReturnPolicy(categoryId = null) {
                        return executeQuery({
                                operationName: "ReturnPolicy",
                                query: `
                                    query ReturnPolicy($categoryId: ID) {
                                        returnPolicy(categoryId: $categoryId) {
                                            days
                                            openedPackageAllowed
                                            notes
                                        }
                                    }
                                `,
                                variables: { categoryId },
                                dataField: "returnPolicy"
                        });
                },
                async getDeliverySlots(postalCode, prefecture) {
                        return executeQuery({
                                operationName: "DeliverySlots",
                                query: `
                                    query DeliverySlots($postalCode: String!, $prefecture: String!) {
                                        deliverySlots(postalCode: $postalCode, prefecture: $prefecture) {
                                            postalCode
                                            prefecture
                                            slots
                                        }
                                    }
                                `,
                                variables: { postalCode, prefecture },
                                dataField: "deliverySlots"
                        });
                },
                async getCart() {
                        return executeQuery({
                                operationName: "CurrentCart",
                                query: `
                                    query CurrentCart {
                                        currentCart {
                                            ${CART_FIELDS}
                                        }
                                    }
                                `,
                                variables: {},
                                dataField: "currentCart"
                        });
                },
                async addItemToCart(itemId, quantity) {
                        return executeMutation({
                                operationName: "AddItemToCart",
                                mutation: `
                                    mutation AddItemToCart($itemId: ID!, $quantity: Int!) {
                                        addItemToCart(itemId: $itemId, quantity: $quantity) {
                                            ${CART_FIELDS}
                                        }
                                    }
                                `,
                                variables: { itemId, quantity },
                                dataField: "addItemToCart"
                        });
                },
                async updateCartItemQuantity(itemId, quantity) {
                        return executeMutation({
                                operationName: "UpdateCartItemQuantity",
                                mutation: `
                                    mutation UpdateCartItemQuantity($itemId: ID!, $quantity: Int!) {
                                        updateCartItemQuantity(itemId: $itemId, quantity: $quantity) {
                                            ${CART_FIELDS}
                                        }
                                    }
                                `,
                                variables: { itemId, quantity },
                                dataField: "updateCartItemQuantity"
                        });
                },
                async removeItemFromCart(itemId) {
                        return executeMutation({
                                operationName: "RemoveItemFromCart",
                                mutation: `
                                    mutation RemoveItemFromCart($itemId: ID!) {
                                        removeItemFromCart(itemId: $itemId) {
                                            ${CART_FIELDS}
                                        }
                                    }
                                `,
                                variables: { itemId },
                                dataField: "removeItemFromCart"
                        });
                },
                async applyCouponToCart(couponCode) {
                        return executeMutation({
                                operationName: "ApplyCouponToCart",
                                mutation: `
                                    mutation ApplyCouponToCart($couponCode: String!) {
                                        applyCouponToCart(couponCode: $couponCode) {
                                            ${CART_FIELDS}
                                        }
                                    }
                                `,
                                variables: { couponCode },
                                dataField: "applyCouponToCart"
                        });
                },
                async getFeaturedProducts(limit = 6) {
                        return executeQuery({
                                operationName: "FeaturedProducts",
                                query: `
                                    query FeaturedProducts($limit: Int) {
                                        featuredProducts(limit: $limit) {
                                            ${PRODUCT_FIELDS}
                                        }
                                    }
                                `,
                                variables: { limit },
                                dataField: "featuredProducts"
                        });
                },
                async getRecommendedProducts({ customerId = null, basedOnItemId = null, limit = 6 } = {}) {
                        return executeQuery({
                                operationName: "RecommendedProducts",
                                query: `
                                    query RecommendedProducts($customerId: ID, $basedOnItemId: ID, $limit: Int) {
                                        recommendedProducts(customerId: $customerId, basedOnItemId: $basedOnItemId, limit: $limit) {
                                            ${PRODUCT_FIELDS}
                                        }
                                    }
                                `,
                                variables: { customerId, basedOnItemId, limit },
                                dataField: "recommendedProducts"
                        });
        }
    };
}