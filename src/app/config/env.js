const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function toBoolean(value, defaultValue = false) {
    if (value == null) return defaultValue;
    return TRUE_VALUES.has(String(value).toLowerCase());
}

function toNumber(value, defaultValue) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function loadConfig() {
    return {
        useExternalApis: toBoolean(process.env.USE_EXTERNAL_APIS, false),
        externalApi: {
            timeoutMs: toNumber(process.env.EXTERNAL_API_TIMEOUT_MS, 4000),
            retryCount: toNumber(process.env.EXTERNAL_API_RETRY_COUNT, 2),
            retryDelayMs: toNumber(process.env.EXTERNAL_API_RETRY_DELAY_MS, 300),
            employee: {
                baseUrl: process.env.EMPLOYEE_API_BASE_URL || "",
                token: process.env.EMPLOYEE_API_TOKEN || ""
            },
            recipe: {
                baseUrl: process.env.RECIPE_API_BASE_URL || "",
                token: process.env.RECIPE_API_TOKEN || ""
            },
            item: {
                baseUrl: process.env.ITEM_API_BASE_URL || "",
                token: process.env.ITEM_API_TOKEN || ""
            }
        }
    };
}
