import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { AppError, toAppError } from "../shared/errors/AppError.js";
import { TOOL_DEFINITIONS } from "./schemas/toolSchemas.js";

export function createMcpServer({ usecases, logger }) {
    const server = new Server(
        { name: "my-custom-api", version: "1.0.0" },
        { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params.name;
        const toolHandler = usecases[toolName];

        if (!toolHandler) {
            throw new AppError(`Unknown tool: ${toolName}`, { code: "MCP_UNKNOWN_TOOL", status: 400 });
        }

        try {
            const result = await toolHandler(request.params.arguments || {});
            return {
                content: [{ type: "text", text: JSON.stringify(result) }]
            };
        } catch (error) {
            const appError = toAppError(error, "Tool execution failed");
            logger.error("Tool execution failed", {
                toolName,
                code: appError.code,
                message: appError.message,
                status: appError.status
            });

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        error: appError.message,
                        code: appError.code
                    })
                }]
            };
        }
    });

    return server;
}
