import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/env.js";
import { createMcpServer } from "../mcp/server.js";
import { createGetEmployeeInfoUseCase } from "../usecases/getEmployeeInfo.js";
import { createGetRecipeByKeywordUseCase } from "../usecases/getRecipeByKeyword.js";
import { createGetItemInfoByIdUseCase } from "../usecases/getItemInfoById.js";
import { createHttpClient } from "../infra/http/client.js";
import { createEmployeeApi } from "../infra/externalApis/employeeApi.js";
import { createRecipeApi } from "../infra/externalApis/recipeApi.js";
import { createItemApi } from "../infra/externalApis/itemApi.js";
import { createExternalApiGateway } from "../gateways/externalApiGateway.js";
import { createLogger } from "../shared/logger/logger.js";

export async function startMcpApp() {
    const logger = createLogger("mcp-server");
    const config = loadConfig();

    const httpClient = createHttpClient({
        timeoutMs: config.externalApi.timeoutMs,
        retryCount: config.externalApi.retryCount,
        retryDelayMs: config.externalApi.retryDelayMs
    });

    const gateway = createExternalApiGateway({
        useExternalApis: config.useExternalApis,
        employeeApi: createEmployeeApi(httpClient, config.externalApi.employee),
        recipeApi: createRecipeApi(httpClient, config.externalApi.recipe),
        itemApi: createItemApi(httpClient, config.externalApi.item)
    });

    const usecases = {
        getEmployeeInfo: createGetEmployeeInfoUseCase({ gateway }),
        getRecipeByKeyword: createGetRecipeByKeywordUseCase({ gateway }),
        getItemInfoById: createGetItemInfoByIdUseCase({ gateway })
    };

    const server = createMcpServer({ usecases, logger });
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info(`MCP server started. useExternalApis=${config.useExternalApis}`);
}
