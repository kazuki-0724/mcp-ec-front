import { createMixedGateway } from "./external/createMixedGateway.js";
import { createMockGateway } from "./mock/createMockGateway.js";

export function createExternalApiGateway(options = {}) {
    console.log("[Gateway] createExternalApiGateway", { mode: options.mode });

    if (options.mode === "mock") {
        return createMockGateway();
    }

    return createMixedGateway(options);
}