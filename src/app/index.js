import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/env.js";
import { createMcpServer } from "../mcp/server.js";
import { createGetRuntimeDiagnosticsUseCase } from "../usecases/getRuntimeDiagnostics.js";
import { createCommerceUsecases } from "../usecases/commerceUseCases.js";
import { createHttpClient } from "../infra/http/client.js";
import { createExternalApiGateway } from "../gateways/externalApiGateway.js";
import { createLogger } from "../shared/logger/logger.js";

function summarizeExternalApiTarget(config) {
    if (config.externalApiMode === "mock") {
        return {
            mode: config.externalApiMode,
            target: "built-in mock data",
            endpoint: null,
            tokenConfigured: false,
            userId: null
        };
    }

    return {
        mode: config.externalApiMode,
        target: "graphql external api",
        endpoint: config.externalApi.graphql.endpoint || null,
        tokenConfigured: Boolean(config.externalApi.graphql.token),
        userId: config.externalApi.graphql.userId || null
    };
}

export async function startMcpApp() {
    const logger = createLogger("mcp-server");
    const config = loadConfig();
    const targetSummary = summarizeExternalApiTarget(config);

    logger.info("External API target resolved", targetSummary);

    const httpClient = createHttpClient({
        timeoutMs: config.externalApi.timeoutMs,
        retryCount: config.externalApi.retryCount,
        retryDelayMs: config.externalApi.retryDelayMs
    });

    const gateway = createExternalApiGateway({
        mode: config.externalApiMode
    });

    const usecases = {
        ...createCommerceUsecases({ gateway }),
        get_runtime_diagnostics: createGetRuntimeDiagnosticsUseCase({
            runtime: {
                processId: process.pid,
                cwd: process.cwd(),
                startedAt: new Date().toISOString(),
                externalApiMode: config.externalApiMode,
                externalApi: config.externalApi,
                envSnapshot: {
                    EXTERNAL_API_MODE: process.env.EXTERNAL_API_MODE || null,
                    USE_EXTERNAL_APIS: process.env.USE_EXTERNAL_APIS || null,
                    GRAPHQL_API_ENDPOINT: process.env.GRAPHQL_API_ENDPOINT || null,
                    GRAPHQL_API_USER_ID: process.env.GRAPHQL_API_USER_ID || null
                }
            }
        })
    };

    const server = createMcpServer({ usecases, logger });
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info(`MCP server started. externalApiMode=${config.externalApiMode}`);
}
