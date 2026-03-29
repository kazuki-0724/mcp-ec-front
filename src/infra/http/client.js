import { AppError } from "../../shared/errors/AppError.js";
import { withRetry } from "./retry.js";

function buildHeaders(defaultHeaders = {}, headers = {}) {
    return { ...defaultHeaders, ...headers };
}

function isRetryableStatus(status) {
    return status === 429 || status === 502 || status === 503 || status === 504;
}

export function createHttpClient(config = {}) {
    const timeoutMs = config.timeoutMs ?? 4000;
    const retryCount = config.retryCount ?? 0;
    const retryDelayMs = config.retryDelayMs ?? 200;

    async function requestJson(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: options.method || "GET",
                headers: buildHeaders(config.defaultHeaders, options.headers),
                body: options.body,
                signal: controller.signal
            });

            if (!response.ok) {
                throw new AppError(`External API request failed: ${response.status}`, {
                    code: "EXTERNAL_API_HTTP_ERROR",
                    status: response.status,
                    details: { url }
                });
            }

            return await response.json();
        } catch (error) {
            if (error?.name === "AbortError") {
                throw new AppError("External API request timeout", {
                    code: "EXTERNAL_API_TIMEOUT",
                    status: 504,
                    details: { url, timeoutMs }
                });
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    return {
        getJson(url, options = {}) {
            return withRetry(
                () => requestJson(url, { ...options, method: "GET" }),
                {
                    retries: retryCount,
                    baseDelayMs: retryDelayMs,
                    shouldRetry: (error) => {
                        if (typeof error?.status === "number") {
                            return isRetryableStatus(error.status);
                        }
                        return false;
                    }
                }
            );
        }
    };
}
