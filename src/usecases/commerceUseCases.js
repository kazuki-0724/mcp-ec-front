function toTrimmedString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value, fallback = 1) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return fallback;
    return Math.floor(numberValue);
}

function withItemNotFound(itemId) {
    return { error: `商品ID「${itemId}」は見つかりませんでした。` };
}

export function createCommerceUsecases({ gateway }) {
    return {
        async get_employee_info(params = {}) {
            const employeeId = toTrimmedString(params.employeeId);
            if (!employeeId) {
                return { error: "社員IDが指定されていません。" };
            }

            const employee = await gateway.getEmployeeInfo(employeeId);
            if (!employee) {
                return { error: "指定された社員IDは見つかりませんでした。" };
            }

            return {
                employeeId,
                name: employee.name,
                department: employee.department,
                role: employee.role,
                email: employee.email
            };
        },

        async get_recipe_by_keyword(params = {}) {
            const keyword = toTrimmedString(params.keyword);
            if (!keyword) {
                return { error: "キーワードが指定されていません。" };
            }

            const recipe = await gateway.getRecipeByKeyword(keyword);
            if (!recipe) {
                return { error: `キーワード「${keyword}」に対応するレシピが見つかりませんでした。` };
            }

            return {
                keyword,
                recipe: {
                    recipeId: recipe.id,
                    recipeName: recipe.name,
                    servings: recipe.servings,
                    requiredIngredients: recipe.ingredients
                },
                nextActionHint: "requiredIngredients[].itemId を使って get_item_info_by_id を呼び出してください。"
            };
        },

        async get_item_info_by_id(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            const item = await gateway.getItemInfoById(itemId);
            if (!item) {
                return withItemNotFound(itemId);
            }

            return {
                itemId: item.id,
                itemName: item.name,
                categoryId: item.categoryId,
                brandId: item.brandId,
                unitPrice: item.unitPrice,
                unit: item.unit,
                stock: item.stock,
                tags: item.tags
            };
        },

        async search_products(params = {}) {
            const query = toTrimmedString(params.query);
            const categoryId = toTrimmedString(params.categoryId);
            const brandId = toTrimmedString(params.brandId);
            const limit = toPositiveInteger(params.limit, 8);

            if (!query && !categoryId && !brandId) {
                return { error: "query, categoryId, brandId のいずれかを指定してください。" };
            }

            return {
                query: query || null,
                categoryId: categoryId || null,
                brandId: brandId || null,
                products: await gateway.searchProducts({ query, categoryId, brandId, limit })
            };
        },

        async get_product_details(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            const product = await gateway.getProductDetails(itemId);
            if (!product) {
                return withItemNotFound(itemId);
            }

            return product;
        },

        async list_categories() {
            return {
                categories: await gateway.listCategories()
            };
        },

        async get_category_products(params = {}) {
            const categoryId = toTrimmedString(params.categoryId);
            if (!categoryId) {
                return { error: "categoryId が指定されていません。" };
            }

            return {
                categoryId,
                products: await gateway.getCategoryProducts(categoryId, {
                    limit: toPositiveInteger(params.limit, 12)
                })
            };
        },

        async list_brands() {
            return {
                brands: await gateway.listBrands()
            };
        },

        async get_brand_products(params = {}) {
            const brandId = toTrimmedString(params.brandId);
            if (!brandId) {
                return { error: "brandId が指定されていません。" };
            }

            return {
                brandId,
                products: await gateway.getBrandProducts(brandId, {
                    limit: toPositiveInteger(params.limit, 12)
                })
            };
        },

        async get_featured_products(params = {}) {
            return {
                products: await gateway.getFeaturedProducts({
                    limit: toPositiveInteger(params.limit, 6)
                })
            };
        },

        async get_recommended_products(params = {}) {
            const customerId = toTrimmedString(params.customerId);
            const basedOnItemId = toTrimmedString(params.basedOnItemId);

            if (!customerId && !basedOnItemId) {
                return { error: "customerId または basedOnItemId のいずれかを指定してください。" };
            }

            return {
                customerId: customerId || null,
                basedOnItemId: basedOnItemId || null,
                products: await gateway.getRecommendedProducts({
                    customerId,
                    basedOnItemId,
                    limit: toPositiveInteger(params.limit, 6)
                })
            };
        },

        async get_price_quote(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            const quote = await gateway.getPriceQuote({
                itemId,
                quantity: toPositiveInteger(params.quantity, 1),
                customerTier: toTrimmedString(params.customerTier) || null
            });

            if (!quote) {
                return withItemNotFound(itemId);
            }

            return quote;
        },

        async get_bulk_price_quote(params = {}) {
            const items = Array.isArray(params.items) ? params.items : [];
            if (items.length === 0) {
                return { error: "items を1件以上指定してください。" };
            }

            return gateway.getBulkPriceQuote({
                items: items.map((item) => ({
                    itemId: toTrimmedString(item?.itemId),
                    quantity: toPositiveInteger(item?.quantity, 1)
                })),
                customerTier: toTrimmedString(params.customerTier) || null,
                couponCode: toTrimmedString(params.couponCode) || null
            });
        },

        async get_inventory_status(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            const inventory = await gateway.getInventoryStatus(itemId);
            if (!inventory) {
                return withItemNotFound(itemId);
            }

            return inventory;
        },

        async get_cart() {
            return gateway.getCart();
        },

        async add_item_to_cart(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            return gateway.addItemToCart({
                itemId,
                quantity: toPositiveInteger(params.quantity, 1)
            });
        },

        async update_cart_item_quantity(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            const quantity = Number(params.quantity);
            if (!Number.isFinite(quantity) || quantity < 0) {
                return { error: "quantity には0以上の数値を指定してください。" };
            }

            return gateway.updateCartItemQuantity({
                itemId,
                quantity: Math.floor(quantity)
            });
        },

        async remove_item_from_cart(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            return gateway.removeItemFromCart({ itemId });
        },

        async apply_coupon_to_cart(params = {}) {
            const couponCode = toTrimmedString(params.couponCode);
            if (!couponCode) {
                return { error: "couponCode が指定されていません。" };
            }

            return gateway.applyCouponToCart({ couponCode });
        },

        async get_available_coupons(params = {}) {
            return {
                coupons: await gateway.getAvailableCoupons({
                    customerTier: toTrimmedString(params.customerTier) || null
                })
            };
        },

        async estimate_shipping_fee(params = {}) {
            const postalCode = toTrimmedString(params.postalCode);
            const prefecture = toTrimmedString(params.prefecture);
            if (!postalCode || !prefecture) {
                return { error: "postalCode と prefecture を指定してください。" };
            }

            return gateway.estimateShippingFee({
                postalCode,
                prefecture,
                shippingMethod: toTrimmedString(params.shippingMethod) || "standard",
                cartTotal: Number(params.cartTotal) || 0
            });
        },

        async get_delivery_slots(params = {}) {
            const postalCode = toTrimmedString(params.postalCode);
            const prefecture = toTrimmedString(params.prefecture);
            if (!postalCode || !prefecture) {
                return { error: "postalCode と prefecture を指定してください。" };
            }

            return {
                postalCode,
                prefecture,
                slots: await gateway.getDeliverySlots({ postalCode, prefecture })
            };
        },

        async validate_shipping_address(params = {}) {
            const postalCode = toTrimmedString(params.postalCode);
            const prefecture = toTrimmedString(params.prefecture);
            const city = toTrimmedString(params.city);
            const line1 = toTrimmedString(params.line1);

            if (!postalCode || !prefecture || !city || !line1) {
                return { error: "postalCode, prefecture, city, line1 を指定してください。" };
            }

            return gateway.validateShippingAddress({
                postalCode,
                prefecture,
                city,
                line1,
                line2: toTrimmedString(params.line2)
            });
        },

        async get_customer_profile(params = {}) {
            const customerId = toTrimmedString(params.customerId);
            if (!customerId) {
                return { error: "customerId が指定されていません。" };
            }

            const profile = await gateway.getCustomerProfile(customerId);
            if (!profile) {
                return { error: `customerId「${customerId}」は見つかりませんでした。` };
            }

            return profile;
        },

        async get_loyalty_summary(params = {}) {
            const customerId = toTrimmedString(params.customerId);
            if (!customerId) {
                return { error: "customerId が指定されていません。" };
            }

            const loyalty = await gateway.getLoyaltySummary(customerId);
            if (!loyalty) {
                return { error: `customerId「${customerId}」は見つかりませんでした。` };
            }

            return loyalty;
        },

        async get_wishlist(params = {}) {
            const customerId = toTrimmedString(params.customerId);
            if (!customerId) {
                return { error: "customerId が指定されていません。" };
            }

            return gateway.getWishlist(customerId);
        },

        async add_item_to_wishlist(params = {}) {
            const customerId = toTrimmedString(params.customerId);
            const itemId = toTrimmedString(params.itemId);
            if (!customerId || !itemId) {
                return { error: "customerId と itemId を指定してください。" };
            }

            return gateway.addItemToWishlist({ customerId, itemId });
        },

        async get_order_history(params = {}) {
            const customerId = toTrimmedString(params.customerId);
            if (!customerId) {
                return { error: "customerId が指定されていません。" };
            }

            return {
                customerId,
                orders: await gateway.getOrderHistory(customerId, {
                    limit: toPositiveInteger(params.limit, 5)
                })
            };
        },

        async get_order_details(params = {}) {
            const orderId = toTrimmedString(params.orderId);
            if (!orderId) {
                return { error: "orderId が指定されていません。" };
            }

            const order = await gateway.getOrderDetails(orderId);
            if (!order) {
                return { error: `orderId「${orderId}」は見つかりませんでした。` };
            }

            return order;
        },

        async get_product_reviews(params = {}) {
            const itemId = toTrimmedString(params.itemId);
            if (!itemId) {
                return { error: "商品IDが指定されていません。" };
            }

            const reviews = await gateway.getProductReviews(itemId, {
                limit: toPositiveInteger(params.limit, 5)
            });

            return {
                itemId,
                reviews
            };
        },

        async get_payment_methods() {
            return {
                paymentMethods: await gateway.getPaymentMethods()
            };
        },

        async get_return_policy(params = {}) {
            const categoryId = toTrimmedString(params.categoryId) || null;
            return gateway.getReturnPolicy({ categoryId });
        }
    };
}