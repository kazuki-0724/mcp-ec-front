import { startMcpApp } from "./src/app/index.js";

startMcpApp().catch((error) => {
    console.error("[MCP Bootstrap Error]", error);
    process.exit(1);
});