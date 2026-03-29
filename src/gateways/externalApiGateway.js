const employeeMockDb = {
    E001: { name: "山田太郎", department: "システム開発部" },
    E002: { name: "佐藤花子", department: "インフラ推進部" }
};

const recipeItemMockDb = {
    G001: { id: "G001", name: "国産 玉ねぎ", unitPrice: 120, unit: "個", stock: 82 },
    G002: { id: "G002", name: "北海道 じゃがいも", unitPrice: 80, unit: "個", stock: 105 },
    G003: { id: "G003", name: "にんじん", unitPrice: 90, unit: "本", stock: 66 },
    G004: { id: "G004", name: "牛こま切れ肉", unitPrice: 450, unit: "100g", stock: 40 },
    G005: { id: "G005", name: "カレールー 中辛", unitPrice: 260, unit: "箱", stock: 120 }
};

const recipeMockDb = [
    {
        id: "RECIPE001",
        name: "カレー",
        keywords: ["カレー", "カレーライス", "カレーの材料"],
        servings: 4,
        ingredients: [
            { ingredientName: "玉ねぎ", requiredQty: "2個", itemId: "G001" },
            { ingredientName: "じゃがいも", requiredQty: "3個", itemId: "G002" },
            { ingredientName: "にんじん", requiredQty: "1本", itemId: "G003" },
            { ingredientName: "牛こま切れ肉", requiredQty: "300g", itemId: "G004" },
            { ingredientName: "カレールー", requiredQty: "1箱", itemId: "G005" },
            { ingredientName: "はちみつ", requiredQty: "1箱", itemId: "G005" }
        ]
    }
];

function createMockGateway() {
    return {
        async getEmployeeInfo(employeeId) {
            console.log("[Gateway] source=mock getEmployeeInfo", { employeeId });
            return employeeMockDb[employeeId] || null;
        },
        async getRecipeByKeyword(keyword) {
            const normalizedKeyword = keyword.trim();
            console.log("[Gateway] source=mock getRecipeByKeyword", { keyword: normalizedKeyword });
            return recipeMockDb.find((entry) =>
                entry.keywords.some((k) => normalizedKeyword.includes(k))
            ) || null;
        },
        async getItemInfoById(itemId) {
            console.log("[Gateway] source=mock getItemInfoById", { itemId });
            return recipeItemMockDb[itemId] || null;
        }
    };
}

export function createExternalApiGateway(options) {
    console.log("[Gateway] createExternalApiGateway", { mode: options.mode });

    if (options.mode === "mock") {
        return createMockGateway();
    }

    const isLocalMode = options.mode === "local";

    return {
        async getEmployeeInfo(employeeId) {
            console.log("[Gateway] source=external getEmployeeInfo", { mode: options.mode, employeeId });
            const employee = await options.employeeApi.getEmployeeInfo(employeeId);
            if (!employee) return null;

            if (isLocalMode && (!employee.name || !employee.department)) {
                throw new Error("Local validation failed: employee response shape is invalid");
            }

            return {
                name: employee.name,
                department: employee.department
            };
        },
        async getRecipeByKeyword(keyword) {
            console.log("[Gateway] source=external getRecipeByKeyword", { mode: options.mode, keyword: keyword?.trim?.() ?? keyword });
            const recipe = await options.recipeApi.getRecipeByKeyword(keyword);
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
            console.log("[Gateway] source=external getItemInfoById", { mode: options.mode, itemId });
            const item = await options.itemApi.getItemInfoById(itemId);
            if (!item) return null;

            if (isLocalMode && (typeof item.unitPrice !== "number" || typeof item.stock !== "number")) {
                throw new Error("Local validation failed: item response shape is invalid");
            }

            return {
                id: item.itemId || item.id,
                name: item.itemName || item.name,
                unitPrice: item.unitPrice,
                unit: item.unit,
                stock: item.stock
            };
        }
    };
}
