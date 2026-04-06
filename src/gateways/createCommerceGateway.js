import {
    buildBulkPriceQuote,
    buildCartSummary,
    buildInventoryStatus,
    buildPriceLine,
    estimateShippingFeeQuote,
    normalizeCustomerTier
} from "../domain/commerce/pricing.js";

function createLookupMap(list, key) {
    return new Map(list.map((entry) => [entry[key], entry]));
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function computeAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
}

function createNotFoundError(entityName) {
    return (id) => ({ error: `${entityName}「${id}」は見つかりませんでした。` });
}

export function createCommerceGateway({ dataSource }) {
    if (!dataSource) {
        throw new Error("dataSource is required");
    }

    async function getCategoryMap() {
        return createLookupMap(await dataSource.listCategories(), "categoryId");
    }

    async function getBrandMap() {
        return createLookupMap(await dataSource.listBrands(), "brandId");
    }

    async function getProductMap() {
        return createLookupMap(await dataSource.listProducts(), "itemId");
    }

    async function enrichProduct(product) {
        if (!product) return null;

        const [categoryMap, brandMap, reviews] = await Promise.all([
            getCategoryMap(),
            getBrandMap(),
            dataSource.getProductReviews(product.itemId)
        ]);

        return {
            itemId: product.itemId,
            itemName: product.itemName,
            categoryId: product.categoryId,
            categoryName: categoryMap.get(product.categoryId)?.categoryName || null,
            brandId: product.brandId,
            brandName: brandMap.get(product.brandId)?.brandName || null,
            unitPrice: product.unitPrice,
            unit: product.unit,
            stock: product.stock,
            tags: product.tags,
            description: product.description,
            featured: product.featured,
            averageRating: computeAverageRating(reviews),
            reviewCount: reviews.length
        };
    }

    async function findCouponByCode(couponCode) {
        const coupons = await dataSource.listCoupons();
        return coupons.find((coupon) => coupon.couponCode === couponCode) || null;
    }

    async function buildPricedLine(itemId, quantity, customerTier) {
        const product = await dataSource.getProduct(itemId);
        if (!product) return null;

        return buildPriceLine({
            product,
            quantity,
            customerTier
        });
    }

    async function summarizeCartState(cart) {
        const customerProfile = await dataSource.getCustomerProfile(cart.customerId);
        const customerTier = customerProfile?.tier || "bronze";
        const lines = (cart.items || [])
            .map((item) => buildPricedLine(item.itemId, item.quantity, customerTier));
        const resolvedLines = (await Promise.all(lines)).filter(Boolean);
        const coupon = cart.couponCode ? await findCouponByCode(cart.couponCode) : null;
        return buildCartSummary({ cart, items: resolvedLines, coupon });
    }

    const notFoundProduct = createNotFoundError("商品ID");
    const notFoundCustomer = createNotFoundError("customerId");

    return {
        async getEmployeeInfo(employeeId) {
            return dataSource.getEmployeeInfo(employeeId);
        },

        async getRecipeByKeyword(keyword) {
            return dataSource.getRecipeByKeyword(keyword);
        },

        async getItemInfoById(itemId) {
            return dataSource.getItemInfoById(itemId);
        },

        async getProduct(itemId) {
            const product = await dataSource.getProduct(itemId);
            return product ? cloneJson(product) : null;
        },

        async getCartState() {
            return cloneJson(await dataSource.getCart());
        },

        async saveCartState(cart) {
            await dataSource.saveCart(cloneJson(cart));
        },

        async getCouponByCode(couponCode) {
            const coupon = await findCouponByCode(couponCode);
            return coupon ? cloneJson(coupon) : null;
        },

        async listCoupons() {
            return cloneJson(await dataSource.listCoupons());
        },

        async searchProducts({ query, categoryId, brandId, limit }) {
            const normalizedQuery = normalizeText(query);
            const [products, categoryMap, brandMap] = await Promise.all([
                dataSource.listProducts(),
                getCategoryMap(),
                getBrandMap()
            ]);

            const matched = products.filter((product) => {
                const matchesQuery = !normalizedQuery || [
                    product.itemName,
                    product.description,
                    ...(product.tags || []),
                    categoryMap.get(product.categoryId)?.categoryName,
                    brandMap.get(product.brandId)?.brandName
                ].some((value) => normalizeText(value).includes(normalizedQuery));
                const matchesCategory = !categoryId || product.categoryId === categoryId;
                const matchesBrand = !brandId || product.brandId === brandId;
                return matchesQuery && matchesCategory && matchesBrand;
            });

            return Promise.all(matched.slice(0, limit).map((product) => enrichProduct(product)));
        },

        async getProductDetails(itemId) {
            return enrichProduct(await dataSource.getProduct(itemId));
        },

        async listCategories() {
            const [categories, products] = await Promise.all([
                dataSource.listCategories(),
                dataSource.listProducts()
            ]);

            return categories.map((category) => ({
                ...category,
                productCount: products.filter((product) => product.categoryId === category.categoryId).length
            }));
        },

        async getCategoryProducts(categoryId, options = {}) {
            const products = await dataSource.listProducts();
            return Promise.all(
                products
                    .filter((product) => product.categoryId === categoryId)
                    .slice(0, options.limit || 12)
                    .map((product) => enrichProduct(product))
            );
        },

        async listBrands() {
            const [brands, products] = await Promise.all([
                dataSource.listBrands(),
                dataSource.listProducts()
            ]);

            return brands.map((brand) => ({
                ...brand,
                productCount: products.filter((product) => product.brandId === brand.brandId).length
            }));
        },

        async getBrandProducts(brandId, options = {}) {
            const products = await dataSource.listProducts();
            return Promise.all(
                products
                    .filter((product) => product.brandId === brandId)
                    .slice(0, options.limit || 12)
                    .map((product) => enrichProduct(product))
            );
        },

        async getFeaturedProducts(options = {}) {
            const productMap = await getProductMap();
            const featuredProductIds = await dataSource.getFeaturedProductIds();
            return Promise.all(
                featuredProductIds
                    .map((itemId) => productMap.get(itemId))
                    .filter(Boolean)
                    .slice(0, options.limit || 6)
                    .map((product) => enrichProduct(product))
            );
        },

        async getRecommendedProducts({ customerId, basedOnItemId, limit }) {
            const [recommendedItemIds, productMap] = await Promise.all([
                dataSource.getRecommendationItemIds({ customerId, basedOnItemId }),
                getProductMap()
            ]);

            return Promise.all(
                recommendedItemIds
                    .slice(0, limit || 6)
                    .map((itemId) => productMap.get(itemId))
                    .filter(Boolean)
                    .map((product) => enrichProduct(product))
            );
        },

        async getPriceQuote({ itemId, quantity, customerTier }) {
            return buildPricedLine(itemId, quantity, customerTier);
        },

        async getBulkPriceQuote({ items, customerTier, couponCode }) {
            const lines = (await Promise.all(
                items.map((item) => buildPricedLine(item.itemId, item.quantity, customerTier))
            )).filter(Boolean);
            const coupon = couponCode ? await findCouponByCode(couponCode) : null;
            return buildBulkPriceQuote({ items: lines, customerTier, couponCode, coupon });
        },

        async getAvailableCoupons({ customerTier }) {
            const tier = normalizeCustomerTier(customerTier);
            const coupons = await dataSource.listCoupons();
            return coupons.filter((coupon) => coupon.eligibleTiers.includes(tier));
        },

        async getInventoryStatus(itemId) {
            const product = await dataSource.getProduct(itemId);
            if (!product) return null;

            return buildInventoryStatus(product);
        },

        async getCart() {
            return summarizeCartState(await dataSource.getCart());
        },

        async addItemToCart({ itemId, quantity }) {
            if (typeof dataSource.addItemToCart === "function") {
                const cart = await dataSource.addItemToCart(itemId, quantity);
                return summarizeCartState(cart);
            }

            const product = await dataSource.getProduct(itemId);
            if (!product) {
                return notFoundProduct(itemId);
            }

            const cart = await dataSource.getCart();
            const existingItem = cart.items.find((item) => item.itemId === itemId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ itemId, quantity });
            }

            await dataSource.saveCart(cart);
            return summarizeCartState(cart);
        },

        async updateCartItemQuantity({ itemId, quantity }) {
            if (typeof dataSource.updateCartItemQuantity === "function") {
                const cart = await dataSource.updateCartItemQuantity(itemId, quantity);
                return summarizeCartState(cart);
            }

            const cart = await dataSource.getCart();
            const item = cart.items.find((entry) => entry.itemId === itemId);
            if (!item) {
                return { error: `カートに itemId「${itemId}」は存在しません。` };
            }

            if (quantity === 0) {
                cart.items = cart.items.filter((entry) => entry.itemId !== itemId);
            } else {
                item.quantity = quantity;
            }

            await dataSource.saveCart(cart);
            return summarizeCartState(cart);
        },

        async removeItemFromCart({ itemId }) {
            if (typeof dataSource.removeItemFromCart === "function") {
                const cart = await dataSource.removeItemFromCart(itemId);
                return summarizeCartState(cart);
            }

            const cart = await dataSource.getCart();
            cart.items = cart.items.filter((entry) => entry.itemId !== itemId);
            await dataSource.saveCart(cart);
            return summarizeCartState(cart);
        },

        async applyCouponToCart({ couponCode }) {
            if (typeof dataSource.applyCouponToCart === "function") {
                const cart = await dataSource.applyCouponToCart(couponCode);
                return summarizeCartState(cart);
            }

            const coupon = await findCouponByCode(couponCode);
            if (!coupon) {
                return { error: `couponCode「${couponCode}」は利用できません。` };
            }

            const cart = await dataSource.getCart();
            cart.couponCode = couponCode;
            await dataSource.saveCart(cart);
            return summarizeCartState(cart);
        },

        async estimateShippingFee({ postalCode, prefecture, shippingMethod, cartTotal }) {
            return estimateShippingFeeQuote({ postalCode, prefecture, shippingMethod, cartTotal });
        },

        async getDeliverySlots({ postalCode, prefecture }) {
            return dataSource.getDeliverySlots({ postalCode, prefecture });
        },

        async validateShippingAddress(address) {
            const isPostalCodeValid = /^\d{7}$/.test(address.postalCode);
            const warnings = [];
            if (!isPostalCodeValid) {
                warnings.push("postalCode はハイフンなし7桁で指定してください。");
            }
            if (address.line1.length < 3) {
                warnings.push("line1 が短すぎる可能性があります。");
            }

            return {
                isValid: isPostalCodeValid && warnings.length === 0,
                normalizedAddress: {
                    postalCode: address.postalCode,
                    prefecture: address.prefecture,
                    city: address.city,
                    line1: address.line1,
                    line2: address.line2 || ""
                },
                warnings
            };
        },

        async getCustomerProfile(customerId) {
            return cloneJson(await dataSource.getCustomerProfile(customerId));
        },

        async getLoyaltySummary(customerId) {
            return cloneJson(await dataSource.getLoyaltySummary(customerId));
        },

        async getWishlist(customerId) {
            const [itemIds, productMap] = await Promise.all([
                dataSource.getWishlistItemIds(customerId),
                getProductMap()
            ]);

            return {
                customerId,
                items: (await Promise.all(itemIds.map((itemId) => enrichProduct(productMap.get(itemId))))).filter(Boolean)
            };
        },

        async addItemToWishlist({ customerId, itemId }) {
            if (typeof dataSource.addItemToWishlist === "function") {
                const customer = await dataSource.getCustomerProfile(customerId);
                if (!customer) {
                    return notFoundCustomer(customerId);
                }

                const itemIds = await dataSource.addItemToWishlist(customerId, itemId);
                const productMap = await getProductMap();

                return {
                    customerId,
                    items: (await Promise.all(itemIds.map((wishlistItemId) => enrichProduct(productMap.get(wishlistItemId))))).filter(Boolean)
                };
            }

            const [customer, product, wishlist] = await Promise.all([
                dataSource.getCustomerProfile(customerId),
                dataSource.getProduct(itemId),
                dataSource.getWishlistItemIds(customerId)
            ]);

            if (!customer) {
                return notFoundCustomer(customerId);
            }
            if (!product) {
                return notFoundProduct(itemId);
            }

            const nextWishlist = [...wishlist];
            if (!nextWishlist.includes(itemId)) {
                nextWishlist.push(itemId);
            }
            await dataSource.saveWishlistItemIds(customerId, nextWishlist);
            return this.getWishlist(customerId);
        },

        async getOrderHistory(customerId, options = {}) {
            const orders = await dataSource.listOrders(customerId);
            return orders
                .slice(0, options.limit || 5)
                .map((order) => ({
                    orderId: order.orderId,
                    orderedAt: order.orderedAt,
                    status: order.status,
                    total: order.total,
                    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
                }));
        },

        async getOrderDetails(orderId) {
            const [order, productMap] = await Promise.all([
                dataSource.getOrder(orderId),
                getProductMap()
            ]);
            if (!order) return null;

            return {
                ...cloneJson(order),
                items: order.items.map((item) => ({
                    ...item,
                    itemName: productMap.get(item.itemId)?.itemName || null
                }))
            };
        },

        async getProductReviews(itemId, options = {}) {
            return (await dataSource.getProductReviews(itemId)).slice(0, options.limit || 5);
        },

        async getPaymentMethods() {
            return cloneJson(await dataSource.getPaymentMethods());
        },

        async getReturnPolicy({ categoryId }) {
            return cloneJson(await dataSource.getReturnPolicy(categoryId));
        }
    };
}