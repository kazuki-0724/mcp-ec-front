import {
    buildBulkPriceQuote,
    buildCartSummary,
    buildInventoryStatus,
    buildPriceLine,
    estimateShippingFeeQuote,
    normalizeCustomerTier
} from "../domain/commerce/pricing.js";
import { createValidatedUsecase, toPositiveInteger, toTrimmedString } from "./helpers/createValidatedUsecase.js";

function withItemNotFound(itemId) {
    return { error: `商品ID「${itemId}」は見つかりませんでした。` };
}

async function buildPricedLine(gateway, { itemId, quantity, customerTier }) {
    const product = await gateway.getProduct(itemId);
    if (!product) return null;

    return buildPriceLine({
        product,
        quantity,
        customerTier
    });
}

async function buildCartSnapshot(gateway) {
    const cart = await gateway.getCartState();
    const customerProfile = await gateway.getCustomerProfile(cart.customerId);
    const customerTier = customerProfile?.tier || "bronze";
    const items = (await Promise.all(
        (cart.items || []).map((item) => buildPricedLine(gateway, {
            itemId: item.itemId,
            quantity: item.quantity,
            customerTier
        }))
    )).filter(Boolean);
    const coupon = cart.couponCode ? await gateway.getCouponByCode(cart.couponCode) : null;

    return buildCartSummary({ cart, items, coupon });
}

async function saveCartAndBuildSnapshot(gateway, cart) {
    await gateway.saveCartState(cart);
    return buildCartSnapshot(gateway);
}

export function createCommerceUsecases({ gateway }) {
    return {
        get_employee_info: createValidatedUsecase(async (read) => {
            const employeeId = read.requiredString("employeeId", "社員IDが指定されていません。");

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
        }),

        get_recipe_by_keyword: createValidatedUsecase(async (read) => {
            const keyword = read.requiredString("keyword", "キーワードが指定されていません。");

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
        }),

        get_item_info_by_id: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");

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
        }),

        search_products: createValidatedUsecase(async (read) => {
            const query = read.optionalString("query");
            const categoryId = read.optionalString("categoryId");
            const brandId = read.optionalString("brandId");
            const limit = read.positiveInteger("limit", 8);

            read.ensure(query || categoryId || brandId, "query, categoryId, brandId のいずれかを指定してください。");

            return {
                query: query || null,
                categoryId: categoryId || null,
                brandId: brandId || null,
                products: await gateway.searchProducts({ query, categoryId, brandId, limit })
            };
        }),

        get_product_details: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");

            const product = await gateway.getProductDetails(itemId);
            if (!product) {
                return withItemNotFound(itemId);
            }

            return product;
        }),

        async list_categories() {
            return {
                categories: await gateway.listCategories()
            };
        },

        get_category_products: createValidatedUsecase(async (read) => {
            const categoryId = read.requiredString("categoryId", "categoryId が指定されていません。");

            return {
                categoryId,
                products: await gateway.getCategoryProducts(categoryId, {
                    limit: read.positiveInteger("limit", 12)
                })
            };
        }),

        async list_brands() {
            return {
                brands: await gateway.listBrands()
            };
        },

        get_brand_products: createValidatedUsecase(async (read) => {
            const brandId = read.requiredString("brandId", "brandId が指定されていません。");

            return {
                brandId,
                products: await gateway.getBrandProducts(brandId, {
                    limit: read.positiveInteger("limit", 12)
                })
            };
        }),

        get_featured_products: createValidatedUsecase(async (read) => {
            return {
                products: await gateway.getFeaturedProducts({
                    limit: read.positiveInteger("limit", 6)
                })
            };
        }),

        get_recommended_products: createValidatedUsecase(async (read) => {
            const customerId = read.optionalString("customerId");
            const basedOnItemId = read.optionalString("basedOnItemId");

            read.ensure(customerId || basedOnItemId, "customerId または basedOnItemId のいずれかを指定してください。");

            return {
                customerId: customerId || null,
                basedOnItemId: basedOnItemId || null,
                products: await gateway.getRecommendedProducts({
                    customerId,
                    basedOnItemId,
                    limit: read.positiveInteger("limit", 6)
                })
            };
        }),

        get_price_quote: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");
            const quote = await buildPricedLine(gateway, {
                itemId,
                quantity: read.positiveInteger("quantity", 1),
                customerTier: read.optionalString("customerTier") || null
            });

            if (!quote) {
                return withItemNotFound(itemId);
            }

            return quote;
        }),

        get_bulk_price_quote: createValidatedUsecase(async (read, params) => {
            const items = Array.isArray(params.items) ? params.items : [];
            read.ensure(items.length > 0, "items を1件以上指定してください。");

            const normalizedItems = items.map((item) => ({
                itemId: toTrimmedString(item?.itemId),
                quantity: toPositiveInteger(item?.quantity, 1)
            }));
            read.ensure(normalizedItems.every((item) => item.itemId), "items[].itemId を指定してください。");

            const lines = (await Promise.all(
                normalizedItems.map((item) => buildPricedLine(gateway, {
                    itemId: item.itemId,
                    quantity: item.quantity,
                    customerTier: read.optionalString("customerTier") || null
                }))
            )).filter(Boolean);
            const couponCode = read.optionalString("couponCode") || null;
            const coupon = couponCode ? await gateway.getCouponByCode(couponCode) : null;

            return buildBulkPriceQuote({
                items: lines,
                customerTier: read.optionalString("customerTier") || null,
                couponCode,
                coupon
            });
        }),

        get_inventory_status: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");
            const product = await gateway.getProduct(itemId);
            if (!product) {
                return withItemNotFound(itemId);
            }

            return buildInventoryStatus(product);
        }),

        async get_cart() {
            return buildCartSnapshot(gateway);
        },

        add_item_to_cart: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");
            const quantity = read.positiveInteger("quantity", 1);
            const product = await gateway.getProduct(itemId);

            if (!product) {
                return withItemNotFound(itemId);
            }

            const cart = await gateway.getCartState();
            const existingItem = cart.items.find((item) => item.itemId === itemId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ itemId, quantity });
            }

            return saveCartAndBuildSnapshot(gateway, cart);
        }),

        update_cart_item_quantity: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");
            const quantity = read.nonNegativeInteger("quantity", "quantity には0以上の数値を指定してください。");
            const cart = await gateway.getCartState();
            const item = cart.items.find((entry) => entry.itemId === itemId);
            if (!item) {
                return { error: `カートに itemId「${itemId}」は存在しません。` };
            }

            if (quantity === 0) {
                cart.items = cart.items.filter((entry) => entry.itemId !== itemId);
            } else {
                item.quantity = quantity;
            }

            return saveCartAndBuildSnapshot(gateway, cart);
        }),

        remove_item_from_cart: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");
            const cart = await gateway.getCartState();
            cart.items = cart.items.filter((entry) => entry.itemId !== itemId);

            return saveCartAndBuildSnapshot(gateway, cart);
        }),

        apply_coupon_to_cart: createValidatedUsecase(async (read) => {
            const couponCode = read.requiredString("couponCode", "couponCode が指定されていません。");
            const coupon = await gateway.getCouponByCode(couponCode);
            if (!coupon) {
                return { error: `couponCode「${couponCode}」は利用できません。` };
            }

            const cart = await gateway.getCartState();
            cart.couponCode = couponCode;

            return saveCartAndBuildSnapshot(gateway, cart);
        }),

        get_available_coupons: createValidatedUsecase(async (read) => {
            const customerTier = normalizeCustomerTier(read.optionalString("customerTier") || null);
            return {
                coupons: (await gateway.listCoupons()).filter((coupon) => coupon.eligibleTiers.includes(customerTier))
            };
        }),

        estimate_shipping_fee: createValidatedUsecase(async (read, params) => {
            const postalCode = read.requiredString("postalCode", "postalCode と prefecture を指定してください。");
            const prefecture = read.requiredString("prefecture", "postalCode と prefecture を指定してください。");

            return estimateShippingFeeQuote({
                postalCode,
                prefecture,
                shippingMethod: read.optionalString("shippingMethod") || "standard",
                cartTotal: Number(params.cartTotal) || 0
            });
        }),

        get_delivery_slots: createValidatedUsecase(async (read) => {
            const postalCode = read.requiredString("postalCode", "postalCode と prefecture を指定してください。");
            const prefecture = read.requiredString("prefecture", "postalCode と prefecture を指定してください。");

            return {
                postalCode,
                prefecture,
                slots: await gateway.getDeliverySlots({ postalCode, prefecture })
            };
        }),

        validate_shipping_address: createValidatedUsecase(async (read) => {
            const postalCode = read.requiredString("postalCode", "postalCode, prefecture, city, line1 を指定してください。");
            const prefecture = read.requiredString("prefecture", "postalCode, prefecture, city, line1 を指定してください。");
            const city = read.requiredString("city", "postalCode, prefecture, city, line1 を指定してください。");
            const line1 = read.requiredString("line1", "postalCode, prefecture, city, line1 を指定してください。");

            return gateway.validateShippingAddress({
                postalCode,
                prefecture,
                city,
                line1,
                line2: read.optionalString("line2")
            });
        }),

        get_customer_profile: createValidatedUsecase(async (read) => {
            const customerId = read.requiredString("customerId", "customerId が指定されていません。");

            const profile = await gateway.getCustomerProfile(customerId);
            if (!profile) {
                return { error: `customerId「${customerId}」は見つかりませんでした。` };
            }

            return profile;
        }),

        get_loyalty_summary: createValidatedUsecase(async (read) => {
            const customerId = read.requiredString("customerId", "customerId が指定されていません。");

            const loyalty = await gateway.getLoyaltySummary(customerId);
            if (!loyalty) {
                return { error: `customerId「${customerId}」は見つかりませんでした。` };
            }

            return loyalty;
        }),

        get_wishlist: createValidatedUsecase(async (read) => {
            const customerId = read.requiredString("customerId", "customerId が指定されていません。");

            return gateway.getWishlist(customerId);
        }),

        add_item_to_wishlist: createValidatedUsecase(async (read) => {
            const customerId = read.requiredString("customerId", "customerId と itemId を指定してください。");
            const itemId = read.requiredString("itemId", "customerId と itemId を指定してください。");

            return gateway.addItemToWishlist({ customerId, itemId });
        }),

        get_order_history: createValidatedUsecase(async (read) => {
            const customerId = read.requiredString("customerId", "customerId が指定されていません。");

            return {
                customerId,
                orders: await gateway.getOrderHistory(customerId, {
                    limit: read.positiveInteger("limit", 5)
                })
            };
        }),

        get_order_details: createValidatedUsecase(async (read) => {
            const orderId = read.requiredString("orderId", "orderId が指定されていません。");

            const order = await gateway.getOrderDetails(orderId);
            if (!order) {
                return { error: `orderId「${orderId}」は見つかりませんでした。` };
            }

            return order;
        }),

        get_product_reviews: createValidatedUsecase(async (read) => {
            const itemId = read.requiredString("itemId", "商品IDが指定されていません。");

            const reviews = await gateway.getProductReviews(itemId, {
                limit: read.positiveInteger("limit", 5)
            });

            return {
                itemId,
                reviews
            };
        }),

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