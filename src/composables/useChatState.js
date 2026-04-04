import { ref } from 'vue';
import { postChat } from '../services/chatApi.js';

const INITIAL_MESSAGES = [
  {
    id: 0,
    role: 'ai',
    text: 'こんにちは。何をお手伝いしましょうか？',
    loading: false
  }
];

function normalizeConversationTurn(turn, index) {
  return {
    turnId: Number(turn?.turnId) || index + 1,
    userPrompt: typeof turn?.userPrompt === 'string' ? turn.userPrompt : '',
    assistantResponse: typeof turn?.assistantResponse === 'string' ? turn.assistantResponse : '',
    toolExecutions: Array.isArray(turn?.toolExecutions) ? turn.toolExecutions : [],
    calledTools: Array.isArray(turn?.calledTools) ? turn.calledTools : [],
    timestamp: typeof turn?.timestamp === 'string' ? turn.timestamp : new Date().toISOString()
  };
}

function normalizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .map((turn, index) => normalizeConversationTurn(turn, index))
    .filter((turn) => turn.userPrompt || turn.assistantResponse);
}

function inferCommerceSectionsFromPrompt(promptText, createEmptyCommerceSections) {
  const text = String(promptText || '').trim();
  const sections = createEmptyCommerceSections();

  if (/(おすすめ|探して|商品|買いたい|欲しい|特集|人気)/.test(text)) {
    sections.featured = true;
  }
  if (/(お気に入り|ウィッシュ|wishlist|ハート|保存)/i.test(text)) {
    sections.wishlist = true;
  }
  if (/(注文|配送|発送|履歴|order|ステータス|届く)/i.test(text)) {
    sections.orders = true;
  }
  if (/(会員|ポイント|住所|プロフィール|ランク|クーポン)/.test(text)) {
    sections.customer = true;
  }

  return sections;
}

function inferCommerceSectionsFromToolExecutions(toolExecutions = [], createEmptyCommerceSections) {
  const sections = createEmptyCommerceSections();

  for (const execution of toolExecutions) {
    switch (execution?.name) {
      case 'get_customer_profile':
      case 'get_loyalty_summary':
      case 'get_available_coupons':
        sections.customer = true;
        break;
      case 'get_order_history':
      case 'get_order_details':
        sections.orders = true;
        break;
      case 'get_wishlist':
      case 'add_item_to_wishlist':
        sections.wishlist = true;
        break;
      case 'get_featured_products':
      case 'get_recommended_products':
      case 'search_products':
      case 'get_product_details':
      case 'get_category_products':
      case 'get_brand_products':
        sections.featured = true;
        break;
      default:
        break;
    }
  }

  return sections;
}

export function useChatState({ commerce }) {
  const prompt = ref('');
  const sending = ref(false);
  const messages = ref(INITIAL_MESSAGES.map((message) => ({ ...message })));
  const conversationHistory = ref([]);
  let messageSeq = 1;

  function createMessage(role, text, loading = false) {
    const message = { id: messageSeq++, role, text, loading };
    messages.value.push(message);
    return message.id;
  }

  function updateMessage(messageId, patch) {
    const index = messages.value.findIndex((message) => message.id === messageId);
    if (index < 0) return;
    messages.value[index] = { ...messages.value[index], ...patch };
  }

  function refreshInlineCommercePayload(messageId) {
    const message = messages.value.find((entry) => entry.id === messageId);
    if (!message?.inlineCommerce) return;

    updateMessage(messageId, {
      inlineCommerce: commerce.buildInlineCommercePayload(messageId, message.inlineCommerce.sections)
    });
  }

  function updateInlineOrderLookup(payload) {
    const messageId = payload?.messageId;
    const value = payload?.value ?? '';

    if (messageId == null) return;

    const message = messages.value.find((entry) => entry.id === messageId);
    if (!message?.inlineCommerce) return;

    updateMessage(messageId, {
      inlineCommerce: {
        ...message.inlineCommerce,
        orderLookupId: value
      }
    });
  }

  async function sendPrompt(options = {}) {
    const trimmedPrompt = prompt.value.trim();
    if (!trimmedPrompt || sending.value) return;

    commerce.commerceStatusMessage.value = '';
    commerce.commerceErrorMessage.value = '';

    const requestedSections = inferCommerceSectionsFromPrompt(
      trimmedPrompt,
      commerce.createEmptyCommerceSections
    );

    createMessage('user', trimmedPrompt);
    prompt.value = '';
    options.closeToolPanel?.();

    const loadingMessageId = createMessage('ai', '考え中...', true);
    const historySnapshot = conversationHistory.value.map((turn, index) => normalizeConversationTurn(turn, index));
    sending.value = true;

    await options.scrollToBottom?.('smooth');

    try {
      const data = await postChat(trimmedPrompt, historySnapshot);
      const toolExecutions = Array.isArray(data.toolExecutions) ? data.toolExecutions : [];
      const inferredSections = inferCommerceSectionsFromToolExecutions(
        toolExecutions,
        commerce.createEmptyCommerceSections
      );
      const combinedSections = {
        customer: requestedSections.customer || inferredSections.customer,
        orders: requestedSections.orders || inferredSections.orders,
        featured: requestedSections.featured || inferredSections.featured,
        wishlist: requestedSections.wishlist || inferredSections.wishlist
      };

      commerce.applyChatToolExecutions(toolExecutions);
      conversationHistory.value = normalizeConversationHistory(
        Array.isArray(data.conversationRecord)
          ? data.conversationRecord
          : [
              ...historySnapshot,
              {
                turnId: historySnapshot.length + 1,
                userPrompt: trimmedPrompt,
                assistantResponse: data.text || data.error || '回答を取得できませんでした。',
                toolExecutions,
                calledTools: Array.isArray(data.debug?.calledTools) ? data.debug.calledTools : []
              }
            ]
      );

      updateMessage(loadingMessageId, {
        text: data.text || data.error || '回答を取得できませんでした。',
        inlineCommerce: commerce.buildInlineCommercePayload(loadingMessageId, combinedSections)
      });
    } catch (error) {
      updateMessage(loadingMessageId, {
        text: `通信エラー: ${error.message}`
      });
    } finally {
      updateMessage(loadingMessageId, { loading: false });
      sending.value = false;
    }
  }

  return {
    prompt,
    sending,
    messages,
    conversationHistory,
    sendPrompt,
    refreshInlineCommercePayload,
    updateInlineOrderLookup
  };
}