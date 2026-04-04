import { createCommerceGateway } from "../createCommerceGateway.js";
import { createExternalDataSource } from "./createExternalDataSource.js";

export function createMixedGateway(options = {}) {
    return createCommerceGateway({
        dataSource: createExternalDataSource(options)
    });
}