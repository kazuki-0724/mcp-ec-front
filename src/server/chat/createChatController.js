import { buildConversationTurn, buildGeminiHistory, sanitizeConversationHistory } from '../../shared/conversation/history.js';
import { resolveErrorMessage, resolveErrorStatus } from '../utils/errors.js';
import { tryParseJson } from '../utils/json.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const status = resolveErrorStatus(error);
  const message = resolveErrorMessage(error).toLowerCase();
  return status === 429 || status === 503 || message.includes('high demand') || message.includes('try again later');
}

async function sendMessageWithRetry(chat, payload, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 800;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await chat.sendMessage(payload);
    } catch (error) {
      const canRetry = isRetryableGeminiError(error) && attempt < maxRetries;
      if (!canRetry) throw error;

      const waitMs = baseDelayMs * (2 ** attempt);
      console.warn(`[Gemini Retry] attempt=${attempt + 1}/${maxRetries + 1}, wait=${waitMs}ms`);
      await sleep(waitMs);
    }
  }
}

export function createChatController({ genAI, mcpClient, externalApiTarget }) {
  return async function chatController(req, res) {
    try {
      const { prompt, conversationHistory } = req.body || {};
      const toolResultTexts = [];
      const calledTools = [];
      const toolExecutions = [];
      const callSignatureCount = new Map();
      const sanitizedConversationHistory = sanitizeConversationHistory(conversationHistory);

      if (typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'prompt must be a non-empty string' });
      }

      console.log(`[Chat Request] ユーザーからのプロンプト: ${prompt}`);
      console.log(`[Chat Request] 引き継いだ会話ターン数: ${sanitizedConversationHistory.length}`);

      const { tools: mcpTools } = await mcpClient.listTools();
      const availableToolNames = new Set(mcpTools.map((tool) => tool.name));

      console.log('[MCP Tools] MCPサーバーから取得したツール:', mcpTools.map((tool) => tool.name));

      const geminiTools = [{
        functionDeclarations: mcpTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'OBJECT',
            properties: tool.inputSchema.properties,
            required: tool.inputSchema.required
          }
        }))
      }];

      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite-preview',
        tools: geminiTools,
        systemInstruction: 'ECアシスタントとして、社員情報・レシピ・商品・カート・お気に入り・注文照会に関する質問は推測せず必ず利用可能なツールを呼び出してから回答してください。会話履歴が与えられている場合は直前の文脈を引き継ぎ、「さっきの件」「それを追加して」のような参照を解決してください。カート更新や注文照会を行った場合は、実行結果に基づいて簡潔に状態変化を説明してください。'
      });
      const chat = model.startChat({ history: buildGeminiHistory(sanitizedConversationHistory) });

      let result = await sendMessageWithRetry(chat, prompt, { maxRetries: 3, baseDelayMs: 800 });
      console.log('[Gemini Response] Geminiからの初回レスポンス:', result.response.text());

      let response = result.response;
      console.log('[Gemini Function Calls] 初回レスポンスに対する関数呼び出し要求:', response.functionCalls());

      const MAX_TOOL_ROUNDS = 5;
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const functionCalls = response.functionCalls() || [];
        if (functionCalls.length === 0) break;

        const signatures = functionCalls.map((call) => `${call.name}:${JSON.stringify(call.args || {})}`);
        const hasCycle = signatures.every((signature) => (callSignatureCount.get(signature) || 0) >= 1);
        if (hasCycle) {
          console.warn('[Function Calling] 同一の関数呼び出しが繰り返されたため、ループ防止で中断します。');
          break;
        }

        const functionResponses = [];
        for (let index = 0; index < functionCalls.length; index++) {
          const call = functionCalls[index];
          const signature = signatures[index];
          callSignatureCount.set(signature, (callSignatureCount.get(signature) || 0) + 1);
          calledTools.push(call.name);

          console.log(`[Function Calling] Geminiが ${call.name} を要求しました。引数:`, call.args);

          if (!availableToolNames.has(call.name)) {
            const unknownToolMessage = `Unknown tool requested by model: ${call.name}. Available tools: ${[...availableToolNames].join(', ')}`;
            console.warn(`[Function Calling] ${unknownToolMessage}`);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: unknownToolMessage }
              }
            });
            continue;
          }

          const toolResult = await mcpClient.callTool({
            name: call.name,
            arguments: call.args
          });
          const toolResultText = toolResult?.content?.[0]?.text ?? null;
          if (toolResultText) toolResultTexts.push(toolResultText);
          const parsedToolResult = tryParseJson(toolResultText);

          console.log(`[Function Calling] MCP result from ${call.name}:`, parsedToolResult ?? toolResultText ?? toolResult);

          toolExecutions.push({
            name: call.name,
            arguments: call.args || {},
            result: parsedToolResult ?? toolResultText ?? toolResult
          });

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: parsedToolResult ?? toolResultText }
            }
          });
        }

        result = await sendMessageWithRetry(chat, functionResponses, { maxRetries: 3, baseDelayMs: 800 });
        response = result.response;
      }

      const responseText = response.text();
      const fallbackText = toolResultTexts.length > 0 ? `ツール実行結果: ${toolResultTexts.join(' | ')}` : null;
      const finalText = responseText || fallbackText || '回答テキストを生成できませんでした。';
      const conversationTurn = buildConversationTurn({
        turnId: sanitizedConversationHistory.length + 1,
        userPrompt: prompt,
        assistantResponse: finalText,
        toolExecutions,
        calledTools
      });

      if (calledTools.length === 0) {
        console.warn('[Function Calling] このリクエストではツール呼び出しが行われませんでした。');
      }

      res.json({
        text: finalText,
        toolExecutions,
        conversationTurn,
        conversationRecord: [...sanitizedConversationHistory, conversationTurn],
        debug: {
          mode: externalApiTarget.mode,
          endpoint: externalApiTarget.endpoint,
          toolCallCount: calledTools.length,
          calledTools
        }
      });
    } catch (error) {
      const status = resolveErrorStatus(error);
      const message = resolveErrorMessage(error);
      console.error('[API /api/chat ERROR]', {
        status,
        message,
        stack: error?.stack,
        cause: error?.cause
      });
      res.status(status).json({ error: message });
    }
  };
}