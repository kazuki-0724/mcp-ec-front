import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { AppError, toAppError } from "../shared/errors/AppError.js";
import { TOOL_DEFINITIONS } from "./schemas/toolSchemas.js";
import { EMPLOYEE_TOOL_NAME, handleEmployeeTool } from "./tools/employeeTool.js";
import { RECIPE_TOOL_NAME, handleRecipeTool } from "./tools/recipeTool.js";
import { ITEM_TOOL_NAME, handleItemTool } from "./tools/itemTool.js";

export function createMcpServer({ usecases, logger }) {
    const server = new Server(
        { name: "my-custom-api", version: "1.0.0" },
        { capabilities: { tools: {} } }
    );

    const handlers = {
        [EMPLOYEE_TOOL_NAME]: (args) => handleEmployeeTool(args, usecases),
        [RECIPE_TOOL_NAME]: (args) => handleRecipeTool(args, usecases),
        [ITEM_TOOL_NAME]: (args) => handleItemTool(args, usecases)
    };

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const toolName = request.params.name;
        const toolHandler = handlers[toolName];

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
