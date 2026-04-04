function createNotImplemented(methodName) {
    return async () => {
        throw new Error(`External data source is not implemented for ${methodName}`);
    };
}

export function createExternalDataSource(options = {}) {
    const isLocalMode = options.mode === "local";

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
        listProducts: createNotImplemented("listProducts"),
        getProduct: createNotImplemented("getProduct"),
        listCategories: createNotImplemented("listCategories"),
        listBrands: createNotImplemented("listBrands"),
        listCoupons: createNotImplemented("listCoupons"),
        getCustomerProfile: createNotImplemented("getCustomerProfile"),
        getLoyaltySummary: createNotImplemented("getLoyaltySummary"),
        getWishlistItemIds: createNotImplemented("getWishlistItemIds"),
        saveWishlistItemIds: createNotImplemented("saveWishlistItemIds"),
        listOrders: createNotImplemented("listOrders"),
        getOrder: createNotImplemented("getOrder"),
        getProductReviews: createNotImplemented("getProductReviews"),
        getPaymentMethods: createNotImplemented("getPaymentMethods"),
        getReturnPolicy: createNotImplemented("getReturnPolicy"),
        getDeliverySlots: createNotImplemented("getDeliverySlots"),
        getCart: createNotImplemented("getCart"),
        saveCart: createNotImplemented("saveCart"),
        getFeaturedProductIds: createNotImplemented("getFeaturedProductIds"),
        getRecommendationItemIds: createNotImplemented("getRecommendationItemIds")
    };
}