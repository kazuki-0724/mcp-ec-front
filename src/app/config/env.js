const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const VALID_EXTERNAL_API_MODES = new Set(["mock", "local", "production"]);

function toBoolean(value, defaultValue = false) {
    if (value == null) return defaultValue;
    return TRUE_VALUES.has(String(value).toLowerCase());
}

function toNumber(value, defaultValue) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
}

function resolveExternalApiMode() {
    const modeRaw = (process.env.EXTERNAL_API_MODE || "").trim().toLowerCase();
    if (VALID_EXTERNAL_API_MODES.has(modeRaw)) {
        return modeRaw;
    }

    const useExternalApis = toBoolean(process.env.USE_EXTERNAL_APIS, false);
    return useExternalApis ? "production" : "mock";
}

function resolveGraphqlEndpoint(mode) {
    const endpoint = (process.env.GRAPHQL_API_ENDPOINT || "").trim();
    if (endpoint) {
        return endpoint;
    }

    return mode === "local" ? "http://localhost:8081/graphql" : "";
}

function assertExternalApiTargetConfigured(mode, endpoint) {
    if (mode !== "mock" && !endpoint) {
        throw new Error(`GRAPHQL_API_ENDPOINT is required when EXTERNAL_API_MODE=${mode}`);
    }
}

export function loadConfig() {
    const mode = resolveExternalApiMode();
    const endpoint = resolveGraphqlEndpoint(mode);

    assertExternalApiTargetConfigured(mode, endpoint);

    return {
        externalApiMode: mode,
        externalApi: {
            timeoutMs: toNumber(process.env.EXTERNAL_API_TIMEOUT_MS, 4000),
            retryCount: toNumber(process.env.EXTERNAL_API_RETRY_COUNT, 2),
            retryDelayMs: toNumber(process.env.EXTERNAL_API_RETRY_DELAY_MS, 300),
            graphql: {
                endpoint,
                token: process.env.GRAPHQL_API_TOKEN || "",
                userId: process.env.GRAPHQL_API_USER_ID || "mcp-server"
            }
        }
    };
}
