export async function withRetry(task, options = {}) {
    const retries = options.retries ?? 0;
    const baseDelayMs = options.baseDelayMs ?? 200;
    const shouldRetry = options.shouldRetry ?? (() => false);

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await task();
        } catch (error) {
            lastError = error;
            if (attempt >= retries || !shouldRetry(error)) {
                throw error;
            }
            const waitMs = baseDelayMs * (2 ** attempt);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
    }

    throw lastError;
}
