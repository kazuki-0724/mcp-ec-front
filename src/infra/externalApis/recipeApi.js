import { AppError } from "../../shared/errors/AppError.js";

export function createRecipeApi(httpClient, apiConfig) {
    const RECIPE_QUERY = `
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
    `;

    return {
        async getRecipeByKeyword(keyword) {
            if (!apiConfig.endpoint) {
                throw new AppError("GRAPHQL_API_ENDPOINT is not configured", {
                    code: "GRAPHQL_API_CONFIG_MISSING",
                    status: 500
                });
            }

            const headers = {
                "X-User-Id": apiConfig.userId || "mcp-server"
            };
            if (apiConfig.token) {
                headers.Authorization = `Bearer ${apiConfig.token}`;
            }

            const payload = {
                operationName: "RecipeByKeyword",
                query: RECIPE_QUERY,
                variables: { keyword }
            };

            const response = await httpClient.postJson(apiConfig.endpoint, {
                headers,
                body: JSON.stringify(payload)
            });

            if (Array.isArray(response?.errors) && response.errors.length > 0) {
                throw new AppError(response.errors[0]?.message || "GraphQL recipe query failed", {
                    code: "GRAPHQL_QUERY_ERROR",
                    status: 502,
                    details: response.errors
                });
            }

            return response?.data?.recipeByKeyword || null;
        }
    };
}
