import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { buildMcpChildEnv } from '../config/externalApiTarget.js';
import { tryParseJson } from '../utils/json.js';

export function createMcpClient({ externalApiTarget, env = process.env }) {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp-server.js'],
    env: buildMcpChildEnv(externalApiTarget, env)
  });
  const client = new Client({ name: 'gemini-client', version: '1.0.0' }, { capabilities: {} });

  async function connect() {
    await client.connect(transport);
    console.log('[Server Config] MCP client connected', externalApiTarget);
  }

  async function callToolByName(name, args = {}) {
    const { tools: mcpTools } = await client.listTools();
    const availableToolNames = new Set(mcpTools.map((tool) => tool.name));

    if (!availableToolNames.has(name)) {
      return {
        ok: false,
        status: 400,
        body: {
          error: `Unknown tool: ${name}`,
          availableTools: [...availableToolNames]
        }
      };
    }

    const toolResult = await client.callTool({
      name,
      arguments: args
    });
    const toolResultText = toolResult?.content?.[0]?.text ?? null;
    const parsedToolResult = tryParseJson(toolResultText);

    return {
      ok: true,
      status: 200,
      body: {
        name,
        data: parsedToolResult ?? toolResultText ?? toolResult
      }
    };
  }

  return {
    client,
    connect,
    callToolByName
  };
}