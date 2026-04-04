import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { createApp } from './src/server/createApp.js';
import { summarizeExternalApiTarget } from './src/server/config/externalApiTarget.js';
import { createMcpClient } from './src/server/mcp/createMcpClient.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const externalApiTarget = summarizeExternalApiTarget(process.env);
const mcp = createMcpClient({ externalApiTarget, env: process.env });

console.log('[Server Config] External API target resolved', externalApiTarget);

await mcp.connect();

const app = createApp({
  genAI,
  mcpClient: mcp.client,
  externalApiTarget,
  callMcpToolByName: mcp.callToolByName,
  env: process.env
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));