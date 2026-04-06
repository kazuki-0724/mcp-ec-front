import { AppError } from "../../shared/errors/AppError.js";

function createNotImplemented(methodName) {
    return async () => {
        throw new AppError(`External data source is not implemented for ${methodName}`, {
            code: "EXTERNAL_API_NOT_IMPLEMENTED",
            status: 501,
            details: { methodName }
        });
    };
}

export function createExternalDataSource(options = {}) {
    const isLocalMode = options.mode === "local";

    function normalizeProduct(product) {
        if (!product) return null;

        return {
            itemId: product.itemId,
            itemName: product.itemName,
            categoryId: product.categoryId,
            brandId: product.brandId,
            unitPrice: product.unitPrice,
            unit: product.unit,
            stock: product.stock,
            tags: product.tags || [],
            description: product.description || null,
            featured: Boolean(product.featured)
        };
    }

    function normalizeCart(cart) {
        if (!cart) return null;

        return {
            cartId: cart.cartId,
            customerId: cart.customerId,
            couponCode: cart.couponCode || null,
            items: (cart.items || []).map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity
            }))
        };
    }

    function normalizeWishlistItems(wishlist) {
        return (wishlist?.items || []).map((item) => item.itemId).filter(Boolean);
    }

    return {
        async getEmployeeInfo(employeeId) {
            const employee = await options.employeeApi?.getEmployeeInfo?.(employeeId);
            if (!employee) return null;

            if (isLocalMode && (!employee.name || !employee.department)) {
                throw new Error("Local validation failed: employee response shape is invalid");
            }

            return {
                employeeId,
                name: employee.name,
                department: employee.department,
                role: employee.role || "external-user",
                email: employee.email || null
            };
        },
        async getRecipeByKeyword(keyword) {
            const recipe = await options.recipeApi?.getRecipeByKeyword?.(keyword);
            if (!recipe) return null;

            if (isLocalMode && !recipe?.recipe?.requiredIngredients && !recipe?.recipe?.ingredients) {
                throw new Error("Local validation failed: recipe response shape is invalid");
            }

            return {
                id: recipe.recipe?.recipeId || recipe.recipeId || recipe.id,
                name: recipe.recipe?.recipeName || recipe.recipeName || recipe.name,
                servings: recipe.recipe?.servings || recipe.servings,
                ingredients: recipe.recipe?.requiredIngredients || recipe.requiredIngredients || recipe.ingredients || []
            };
        },
        async getItemInfoById(itemId) {
            const item = await options.itemApi?.getItemInfoById?.(itemId);
            if (!item) return null;

            if (isLocalMode && (typeof item.unitPrice !== "number" || typeof item.stock !== "number")) {
                throw new Error("Local validation failed: item response shape is invalid");
            }

            return {
                id: item.itemId || item.id,
                name: item.itemName || item.name,
                categoryId: item.categoryId || null,
                brandId: item.brandId || null,
                unitPrice: item.unitPrice,
                unit: item.unit,
                stock: item.stock,
                tags: item.tags || []
            };
        },
        async listProducts() {
            return (await options.listProducts?.())?.map(normalizeProduct) || [];
        },
        async getProduct(itemId) {
            return normalizeProduct(await options.getProduct?.(itemId));
        },
        async listCategories() {
            return (await options.listCategories?.()) || [];
        },
        async listBrands() {
            return (await options.listBrands?.()) || [];
        },
        async listCoupons() {
            return (await options.listCoupons?.()) || [];
        },
        async getCustomerProfile(customerId) {
            return await options.getCustomerProfile?.(customerId) || null;
        },
        async getLoyaltySummary(customerId) {
            return await options.getLoyaltySummary?.(customerId) || null;
        },
        async getWishlistItemIds(customerId) {
            return normalizeWishlistItems(await options.getWishlist?.(customerId));
        },
        saveWishlistItemIds: createNotImplemented("saveWishlistItemIds"),
        async addItemToWishlist(customerId, itemId) {
            return normalizeWishlistItems(await options.addItemToWishlist?.(customerId, itemId));
        },
        async listOrders(customerId) {
            return (await options.listOrders?.(customerId)) || [];
        },
        async getOrder(orderId) {
            return await options.getOrder?.(orderId) || null;
        },
        async getProductReviews(itemId) {
            return (await options.getProductReviews?.(itemId)) || [];
        },
        async getPaymentMethods() {
            return (await options.getPaymentMethods?.()) || [];
        },
        async getReturnPolicy(categoryId) {
            return await options.getReturnPolicy?.(categoryId) || null;
        },
        async getDeliverySlots(input) {
            const postalCode = typeof input === "string" ? "0000000" : input?.postalCode || "0000000";
            const prefecture = typeof input === "string" ? input : input?.prefecture;
            const result = await options.getDeliverySlots?.(postalCode, prefecture);
            return result?.slots || [];
        },
        async getCart() {
            return normalizeCart(await options.getCart?.());
        },
        saveCart: createNotImplemented("saveCart"),
        async addItemToCart(itemId, quantity) {
            return normalizeCart(await options.addItemToCart?.(itemId, quantity));
        },
        async updateCartItemQuantity(itemId, quantity) {
            return normalizeCart(await options.updateCartItemQuantity?.(itemId, quantity));
        },
        async removeItemFromCart(itemId) {
            return normalizeCart(await options.removeItemFromCart?.(itemId));
        },
        async applyCouponToCart(couponCode) {
            return normalizeCart(await options.applyCouponToCart?.(couponCode));
        },
        async getFeaturedProductIds() {
            return ((await options.getFeaturedProducts?.(100)) || []).map((product) => product.itemId);
        },
        async getRecommendationItemIds({ customerId, basedOnItemId }) {
            return ((await options.getRecommendedProducts?.({ customerId, basedOnItemId, limit: 100 })) || []).map((product) => product.itemId);
        }
    };
}