import { createCommerceGateway } from "../createCommerceGateway.js";
import { createMockDataSource } from "./createMockDataSource.js";

export function createMockGateway() {
    return createCommerceGateway({
        dataSource: createMockDataSource()
    });
}