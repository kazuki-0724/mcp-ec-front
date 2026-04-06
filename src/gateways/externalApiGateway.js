import { createCommerceGateway } from "./createCommerceGateway.js";
import { createMixedGateway } from "./external/createMixedGateway.js";
import { createExternalDataSource } from "./external/createExternalDataSource.js";
import { createMockGateway } from "./mock/createMockGateway.js";

export function createExternalApiGateway(options = {}) {
    console.log("[Gateway] createExternalApiGateway", { mode: options.mode });

    if (options.mode === "mock") {
        return createMockGateway();
    }

    if (options.mode === "local") {
        return createMixedGateway(options);
    }

    return createCommerceGateway({
        dataSource: createExternalDataSource(options)
    });
}