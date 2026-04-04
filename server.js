import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';

dotenv.config();

function toBoolean(value, defaultValue = false) {
    if (value == null) return defaultValue;
    return new Set(['1', 'true', 'yes', 'on']).has(String(value).toLowerCase());
}

function resolveExternalApiMode() {
    const modeRaw = (process.env.EXTERNAL_API_MODE || '').trim().toLowerCase();
    if (modeRaw === 'mock' || modeRaw === 'local' || modeRaw === 'production') {
        return modeRaw;
    }

    return toBoolean(process.env.USE_EXTERNAL_APIS, false) ? 'production' : 'mock';
}

function summarizeExternalApiTarget() {
    const mode = resolveExternalApiMode();
    const endpoint = process.env.GRAPHQL_API_ENDPOINT || (mode === 'local' ? 'http://localhost:8081/graphql' : null);

    if (mode === 'mock') {
        return {
            mode,
            target: 'built-in mock data',
            endpoint: null,
            tokenConfigured: false,
            userId: null
        };
    }

    return {
        mode,
        target: 'graphql external api',
        endpoint,
        tokenConfigured: Boolean(process.env.GRAPHQL_API_TOKEN),
        userId: process.env.GRAPHQL_API_USER_ID || 'mcp-server'
    };
}

const externalApiTarget = summarizeExternalApiTarget();

function buildMcpChildEnv() {
    const env = {
        ...process.env
    };

    if (externalApiTarget.mode) {
        env.EXTERNAL_API_MODE = externalApiTarget.mode;
    }
    if (externalApiTarget.endpoint) {
        env.GRAPHQL_API_ENDPOINT = externalApiTarget.endpoint;
    }
    if (process.env.GRAPHQL_API_USER_ID) {
        env.GRAPHQL_API_USER_ID = process.env.GRAPHQL_API_USER_ID;
    }
    if (process.env.GRAPHQL_API_TOKEN) {
        env.GRAPHQL_API_TOKEN = process.env.GRAPHQL_API_TOKEN;
    }

    return env;
}

const app = express();
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MCPクライアントの初期化（mcp-server.jsを子プロセスとして起動）
const mcpTransport = new StdioClientTransport({
    command: "node",
    args: ["mcp-server.js"],
    env: buildMcpChildEnv()
});
const mcpClient = new Client({ name: "gemini-client", version: "1.0.0" }, { capabilities: {} });

async function initMCP() {
    await mcpClient.connect(mcpTransport);
    console.log('[Server Config] MCP client connected', externalApiTarget);
}
initMCP();

console.log('[Server Config] External API target resolved', externalApiTarget);

function resolveErrorStatus(error) {
    if (typeof error?.status === 'number') return error.status;
    if (typeof error?.statusCode === 'number') return error.statusCode;
    if (typeof error?.cause?.status === 'number') return error.cause.status;
    if (typeof error?.cause?.statusCode === 'number') return error.cause.statusCode;
    return 500;
}

function resolveErrorMessage(error) {
    return error?.message || error?.cause?.message || 'Unknown error';
}

function tryParseJson(text) {
    if (typeof text !== 'string') return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateText(value, maxLength = 1200) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

function sanitizeConversationHistory(history) {
    if (!Array.isArray(history)) return [];

    return history
        .map((turn, index) => ({
            turnId: Number(turn?.turnId) || index + 1,
            userPrompt: truncateText(turn?.userPrompt, 1000),
            assistantResponse: truncateText(turn?.assistantResponse, 1600),
            toolExecutions: Array.isArray(turn?.toolExecutions)
                ? turn.toolExecutions.slice(0, 6).map((execution) => ({
                    name: execution?.name || '',
                    arguments: execution?.arguments && typeof execution.arguments === 'object' ? execution.arguments : {},
                    result: execution?.result ?? null
                }))
                : [],
            calledTools: Array.isArray(turn?.calledTools)
                ? turn.calledTools.filter((name) => typeof name === 'string' && name.trim())
                : [],
            timestamp: typeof turn?.timestamp === 'string' ? turn.timestamp : null
        }))
        .filter((turn) => turn.userPrompt || turn.assistantResponse)
        .slice(-8);
}

function summarizeToolExecutionsForHistory(toolExecutions = []) {
    if (!Array.isArray(toolExecutions) || toolExecutions.length === 0) return '';

    return toolExecutions
        .slice(0, 4)
        .map((execution) => {
            const name = execution?.name || 'unknown_tool';
            const args = JSON.stringify(execution?.arguments || {});
            const result = truncateText(JSON.stringify(execution?.result ?? null), 400);
            return `- ${name} args=${args} result=${result}`;
        })
        .join('\n');
}

function buildHistoryModelText(turn) {
    const assistantResponse = truncateText(turn?.assistantResponse, 1600);
    const toolSummary = summarizeToolExecutionsForHistory(turn?.toolExecutions);

    if (assistantResponse && toolSummary) {
        return `${assistantResponse}\n\n参照ツール結果:\n${toolSummary}`;
    }

    return assistantResponse || (toolSummary ? `参照ツール結果:\n${toolSummary}` : '');
}

function buildGeminiHistory(conversationHistory) {
    const history = [];

    for (const turn of conversationHistory) {
        if (turn.userPrompt) {
            history.push({
                role: 'user',
                parts: [{ text: turn.userPrompt }]
            });
        }

        const modelText = buildHistoryModelText(turn);
        if (modelText) {
            history.push({
                role: 'model',
                parts: [{ text: modelText }]
            });
        }
    }

    return history;
}

function buildConversationTurn({ turnId, userPrompt, assistantResponse, toolExecutions, calledTools }) {
    return {
        turnId,
        userPrompt: truncateText(userPrompt, 1000),
        assistantResponse: truncateText(assistantResponse, 1600),
        toolExecutions: Array.isArray(toolExecutions) ? toolExecutions : [],
        calledTools: Array.isArray(calledTools) ? calledTools : [],
        timestamp: new Date().toISOString()
    };
}

const DEV_GRAPHQL_QUERIES = {
    employee: {
        operationName: 'EmployeeById',
        query: `
            query EmployeeById($employeeId: ID!) {
                employeeById(employeeId: $employeeId) {
                    employeeId
                    name
                    department
                }
            }
        `
    },
    recipe: {
        operationName: 'RecipeByKeyword',
        query: `
            query RecipeByKeyword($keyword: String!) {
                recipeByKeyword(keyword: $keyword) {
                    keyword
                    nextActionHint
                    recipe {
                        recipeId
                        recipeName
                        servings
                        requiredIngredients {
                            ingredientName
                            requiredQty
                            itemId
                        }
                    }
                }
            }
        `
    },
    item: {
        operationName: 'ItemById',
        query: `
            query ItemById($itemId: ID!) {
                itemById(itemId: $itemId) {
                    itemId
                    itemName
                    unitPrice
                    unit
                    stock
                }
            }
        `
    }
};

function buildDevHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': process.env.GRAPHQL_API_USER_ID || 'mcp-server'
    };

    if (process.env.GRAPHQL_API_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GRAPHQL_API_TOKEN}`;
    }

    return headers;
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

async function callMcpToolByName(name, args = {}) {
    const { tools: mcpTools } = await mcpClient.listTools();
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

    const toolResult = await mcpClient.callTool({
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

app.get('/api/dev/external-target', (_req, res) => {
    res.json({
        ...externalApiTarget,
        endpointReachableByConfig: Boolean(externalApiTarget.endpoint)
    });
});

app.get('/api/dev/mcp-runtime-diagnostics', async (_req, res) => {
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

app.post('/api/dev/graphql-probe', async (req, res) => {
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
            headers: buildDevHeaders(),
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

app.post('/api/chat', async (req, res) => {
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

        // 1. MCPサーバーから利用可能なツール一覧を取得
        const { tools: mcpTools } = await mcpClient.listTools();
        const availableToolNames = new Set(mcpTools.map((tool) => tool.name));

        console.log(`[MCP Tools] MCPサーバーから取得したツール:`, mcpTools.map(t => t.name));

        // 2. MCPのJSON Schemaを、Gemini APIのFunctionDeclaration形式に変換
        const geminiTools = [{
            functionDeclarations: mcpTools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: "OBJECT",
                    properties: tool.inputSchema.properties,
                    required: tool.inputSchema.required
                }
            }))
        }];

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            tools: geminiTools,
            systemInstruction: "ECアシスタントとして、社員情報・レシピ・商品・カート・お気に入り・注文照会に関する質問は推測せず必ず利用可能なツールを呼び出してから回答してください。会話履歴が与えられている場合は直前の文脈を引き継ぎ、『さっきの件』『それを追加して』のような参照を解決してください。カート更新や注文照会を行った場合は、実行結果に基づいて簡潔に状態変化を説明してください。"
        });
        const chat = model.startChat({ history: buildGeminiHistory(sanitizedConversationHistory) });
        // 3. Geminiにプロンプトを送信
        let result = await sendMessageWithRetry(chat, prompt, { maxRetries: 3, baseDelayMs: 800 });
        console.log(`[Gemini Response] Geminiからの初回レスポンス:`, result.response.text());

        let response = result.response;
        console.log(`[Gemini Function Calls] 初回レスポンスに対する関数呼び出し要求:`, response.functionCalls());

        // 4. Geminiが関数呼び出しを返す限り、順次ツール実行して会話を継続
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
            for (let i = 0; i < functionCalls.length; i++) {
                const call = functionCalls[i];
                const signature = signatures[i];
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

                console.log(
                    `[Function Calling] MCP result from ${call.name}:`,
                    parsedToolResult ?? toolResultText ?? toolResult
                );

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

        // フロントエンドへ最終回答を返却
        const responseText = response.text();
        const fallbackText = toolResultTexts.length > 0
            ? `ツール実行結果: ${toolResultTexts.join(' | ')}`
            : null;
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
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));