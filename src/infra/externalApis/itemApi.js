import { AppError } from "../../shared/errors/AppError.js";

export function createItemApi(httpClient, apiConfig) {
    return {
        async getItemInfoById(itemId) {
            if (!apiConfig.baseUrl) {
                throw new AppError("ITEM_API_BASE_URL is not configured", {
                    code: "ITEM_API_CONFIG_MISSING",
                    status: 500
                });
            }

            const url = `${apiConfig.baseUrl.replace(/\/$/, "")}/items/${encodeURIComponent(itemId)}`;
            const headers = apiConfig.token ? { Authorization: `Bearer ${apiConfig.token}` } : {};
            return httpClient.getJson(url, { headers });
        }
    };
}
