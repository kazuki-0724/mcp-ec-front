import express from 'express';
import { createChatController } from './chat/createChatController.js';
import { createDevRouter } from './dev/createDevRouter.js';
import { resolveErrorMessage, resolveErrorStatus } from './utils/errors.js';

export function createApp({ genAI, mcpClient, externalApiTarget, callMcpToolByName, env = process.env }) {
  const app = express();

  app.use(express.json());
  app.use(express.static('public'));
  app.use('/api/dev', createDevRouter({ externalApiTarget, mcpClient, env }));
  app.post('/api/chat', createChatController({ genAI, mcpClient, externalApiTarget }));

  app.post('/api/mcp/tool', async (req, res) => {
    try {
      const { name, arguments: args } = req.body || {};

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          error: 'name must be a non-empty string'
        });
      }

      const result = await callMcpToolByName(name, args || {});
      return res.status(result.status).json(result.body);
    } catch (error) {
      const status = resolveErrorStatus(error);
      res.status(status).json({
        error: resolveErrorMessage(error)
      });
    }
  });

  return app;
}