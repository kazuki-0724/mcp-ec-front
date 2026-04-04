function truncateText(value, maxLength = 1200) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
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

export function sanitizeConversationHistory(history) {
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

export function buildGeminiHistory(conversationHistory) {
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

export function buildConversationTurn({ turnId, userPrompt, assistantResponse, toolExecutions, calledTools }) {
  return {
    turnId,
    userPrompt: truncateText(userPrompt, 1000),
    assistantResponse: truncateText(assistantResponse, 1600),
    toolExecutions: Array.isArray(toolExecutions) ? toolExecutions : [],
    calledTools: Array.isArray(calledTools) ? calledTools : [],
    timestamp: new Date().toISOString()
  };
}