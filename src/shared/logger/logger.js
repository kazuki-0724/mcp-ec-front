export function createLogger(scope = "app") {
    return {
        info(message, meta) {
            if (meta) {
                console.log(`[${scope}] ${message}`, meta);
                return;
            }
            console.log(`[${scope}] ${message}`);
        },
        warn(message, meta) {
            if (meta) {
                console.warn(`[${scope}] ${message}`, meta);
                return;
            }
            console.warn(`[${scope}] ${message}`);
        },
        error(message, meta) {
            if (meta) {
                console.error(`[${scope}] ${message}`, meta);
                return;
            }
            console.error(`[${scope}] ${message}`);
        }
    };
}
