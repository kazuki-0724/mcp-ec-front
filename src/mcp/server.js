import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { AppError, toAppError } from "../shared/errors/AppError.js";
import { createToolRegistry } from "./registry/toolRegistry.js";

export function createMcpServer({ usecases, logger }) {
    const server = new Server(
        { name: "my-custom-api", version: "1.0.0" },
        { capabilities: { tools: {} } }
    );
    const toolRegistry = createToolRegistry({ usecases });

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolRegistry.listDefinitions() }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params.name;
        const toolEntry = toolRegistry.get(toolName);
        const toolHandler = toolEntry?.handler;

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
