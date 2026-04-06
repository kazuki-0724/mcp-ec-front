import { createCommerceGateway } from "../createCommerceGateway.js";
import { createMockDataSource } from "../mock/createMockDataSource.js";
import { createExternalDataSource } from "./createExternalDataSource.js";

function shouldFallbackToMock(error) {
    return error?.code === "EXTERNAL_API_NOT_IMPLEMENTED";
}

function createMixedDataSource({ primaryDataSource, fallbackDataSource, logger }) {
    const methodNames = new Set([
        ...Object.keys(primaryDataSource || {}),
        ...Object.keys(fallbackDataSource || {})
    ]);

    return Object.fromEntries([...methodNames].map((methodName) => [methodName, async (...args) => {
        const primaryMethod = primaryDataSource?.[methodName];
        const fallbackMethod = fallbackDataSource?.[methodName];

        if (typeof primaryMethod !== "function") {
            return fallbackMethod(...args);
        }

        try {
            return await primaryMethod(...args);
        } catch (error) {
            if (typeof fallbackMethod === "function" && shouldFallbackToMock(error)) {
                logger?.warn?.("Falling back to mock data source for local mode", {
                    methodName,
                    reason: error.message
                });
                return fallbackMethod(...args);
            }

            throw error;
        }
    }]));
}

export function createMixedGateway(options = {}) {
    const externalDataSource = createExternalDataSource(options);
    const mockDataSource = createMockDataSource();

    return createCommerceGateway({
        dataSource: createMixedDataSource({
            primaryDataSource: externalDataSource,
            fallbackDataSource: mockDataSource,
            logger: options.logger
        })
    });
}