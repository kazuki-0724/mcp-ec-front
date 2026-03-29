import { AppError } from "../../shared/errors/AppError.js";

export function createRecipeApi(httpClient, apiConfig) {
    return {
        async getRecipeByKeyword(keyword) {
            if (!apiConfig.baseUrl) {
                throw new AppError("RECIPE_API_BASE_URL is not configured", {
                    code: "RECIPE_API_CONFIG_MISSING",
                    status: 500
                });
            }

            const baseUrl = apiConfig.baseUrl.replace(/\/$/, "");
            const url = `${baseUrl}/recipes/search?keyword=${encodeURIComponent(keyword)}`;
            const headers = apiConfig.token ? { Authorization: `Bearer ${apiConfig.token}` } : {};
            return httpClient.getJson(url, { headers });
        }
    };
}
