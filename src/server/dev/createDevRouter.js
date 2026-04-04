import express from 'express';
import { DEV_GRAPHQL_QUERIES, buildDevHeaders } from '../config/externalApiTarget.js';
import { resolveErrorMessage, resolveErrorStatus } from '../utils/errors.js';
import { tryParseJson } from '../utils/json.js';

export function createDevRouter({ externalApiTarget, mcpClient, env = process.env }) {
  const router = express.Router();

  router.get('/external-target', (_req, res) => {
    res.json({
      ...externalApiTarget,
      endpointReachableByConfig: Boolean(externalApiTarget.endpoint)
    });
  });

  router.get('/mcp-runtime-diagnostics', async (_req, res) => {
    try {
      const toolResult = await mcpClient.callTool({
        name: 'get_runtime_diagnostics',
        arguments: {}
      });
      const toolResultText = toolResult?.content?.[0]?.text ?? null;
      const parsedToolResult = tryParseJson(toolResultText);

      res.json({
        ok: true,
        parent: {
          processId: process.pid,
          mode: externalApiTarget.mode,
          endpoint: externalApiTarget.endpoint
        },
        child: parsedToolResult ?? toolResultText ?? toolResult
      });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({
        ok: false,
        error: resolveErrorMessage(error),
        parent: {
          processId: process.pid,
          mode: externalApiTarget.mode,
          endpoint: externalApiTarget.endpoint
        }
      });
    }
  });

  router.post('/graphql-probe', async (req, res) => {
    try {
      const { operation, variables } = req.body || {};
      const queryDef = DEV_GRAPHQL_QUERIES[operation];

      if (!queryDef) {
        return res.status(400).json({
          error: 'operation must be one of: employee, recipe, item'
        });
      }

      if (!externalApiTarget.endpoint) {
        return res.status(400).json({
          error: 'GRAPHQL_API_ENDPOINT is not configured for current mode',
          target: externalApiTarget
        });
      }

      const payload = {
        operationName: queryDef.operationName,
        query: queryDef.query,
        variables: variables || {}
      };

      const response = await fetch(externalApiTarget.endpoint, {
        method: 'POST',
        headers: buildDevHeaders(env),
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const body = isJson ? await response.json() : await response.text();

      res.status(response.status).json({
        ok: response.ok,
        mode: externalApiTarget.mode,
        endpoint: externalApiTarget.endpoint,
        request: {
          operation,
          variables: variables || {}
        },
        response: body
      });
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({
        error: resolveErrorMessage(error),
        mode: externalApiTarget.mode,
        endpoint: externalApiTarget.endpoint
      });
    }
  });

  return router;
}