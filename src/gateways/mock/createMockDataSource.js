import { createMockDatabase } from "./mockDatabase.js";

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

export function createMockDataSource() {
    const database = createMockDatabase();

    return {
        async getEmployeeInfo(employeeId) {
            return cloneJson(database.employees[employeeId] || null);
        },
        async getRecipeByKeyword(keyword) {
            const normalizedKeyword = normalizeText(keyword);
            const recipe = database.recipes.find((entry) => {
                const candidates = [entry.name, ...(entry.keywords || [])];
                return candidates.some((value) => {
                    const normalizedValue = normalizeText(value);
                    return normalizedValue.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedValue);
                });
            });

            if (!recipe) return null;

            return {
                id: recipe.id,
                name: recipe.name,
                servings: recipe.servings,
                ingredients: cloneJson(recipe.ingredients)
            };
        },
        async getItemInfoById(itemId) {
            const product = database.products.find((entry) => entry.itemId === itemId);
            if (!product) return null;

            return {
                id: product.itemId,
                name: product.itemName,
                categoryId: product.categoryId,
                brandId: product.brandId,
                unitPrice: product.unitPrice,
                unit: product.unit,
                stock: product.stock,
                tags: cloneJson(product.tags || [])
            };
        },
        async listProducts() {
            return cloneJson(database.products);
        },
        async getProduct(itemId) {
            return cloneJson(database.products.find((entry) => entry.itemId === itemId) || null);
        },
        async listCategories() {
            return cloneJson(database.categories);
        },
        async listBrands() {
            return cloneJson(database.brands);
        },
        async listCoupons() {
            return cloneJson(database.coupons);
        },
        async getCustomerProfile(customerId) {
            return cloneJson(database.customerProfiles[customerId] || null);
        },
        async getLoyaltySummary(customerId) {
            return cloneJson(database.loyalty[customerId] || null);
        },
        async getWishlistItemIds(customerId) {
            return cloneJson(database.wishlist[customerId] || []);
        },
        async saveWishlistItemIds(customerId, itemIds) {
            database.wishlist[customerId] = cloneJson(itemIds);
        },
        async listOrders(customerId) {
            return cloneJson(database.orders.filter((order) => order.customerId === customerId));
        },
        async getOrder(orderId) {
            return cloneJson(database.orders.find((entry) => entry.orderId === orderId) || null);
        },
        async getProductReviews(itemId) {
            return cloneJson(database.reviews[itemId] || []);
        },
        async getPaymentMethods() {
            return cloneJson(database.paymentMethods);
        },
        async getReturnPolicy(categoryId) {
            return cloneJson(database.returnPolicy.byCategory[categoryId] || database.returnPolicy.default);
        },
        async getDeliverySlots(input) {
            const prefecture = typeof input === "string" ? input : input?.prefecture;
            return ["北海道", "沖縄県"].includes(prefecture)
                ? cloneJson(database.deliverySlots.remote)
                : cloneJson(database.deliverySlots.default);
        },
        async getCart() {
            return cloneJson(database.cart);
        },
        async saveCart(cart) {
            database.cart = cloneJson(cart);
        },
        async getFeaturedProductIds() {
            return cloneJson(database.featuredProductIds);
        },
        async getRecommendationItemIds({ customerId, basedOnItemId }) {
            if (basedOnItemId) {
                return cloneJson(database.recommendationMap[basedOnItemId] || database.recommendationMap.default);
            }

            if (customerId) {
                const profile = database.customerProfiles[customerId];
                const favoriteCategories = profile?.favoriteCategoryIds || [];
                const itemIds = database.products
                    .filter((product) => favoriteCategories.includes(product.categoryId))
                    .map((product) => product.itemId);
                if (itemIds.length > 0) {
                    return cloneJson(itemIds);
                }
            }

            return cloneJson(database.recommendationMap.default);
        }
    };
}