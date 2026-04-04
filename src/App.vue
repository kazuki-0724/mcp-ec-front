<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import ChatInputBar from './components/ChatInputBar.vue';
import AiClipboardDrawer from './components/AiClipboardDrawer.vue';
import CommerceDeskPanel from './components/CommerceDeskPanel.vue';
import ConversationRecordPanel from './components/ConversationRecordPanel.vue';
import ToolMenuPanel from './components/ToolMenuPanel.vue';
import DeveloperConsole from './components/DeveloperConsole.vue';
import { useChatState } from './composables/useChatState.js';
import { useCommerceState } from './composables/useCommerceState.js';
import { useDeveloperTools } from './composables/useDeveloperTools.js';

const activeMenu = ref('chat');
const activeToolPanel = ref('');
const commerce = useCommerceState();
const developerTools = useDeveloperTools();
const chat = useChatState({ commerce });

const {
  prompt,
  sending,
  messages,
  conversationHistory,
  sendPrompt,
  refreshInlineCommercePayload,
  updateInlineOrderLookup
} = chat;

const {
  customerProfile,
  loyaltySummary,
  cart,
  availableCoupons,
  commerceLoading,
  orderLoading,
  pendingProductId,
  busyCartItemId,
  applyingCoupon,
  couponCode,
  refreshCommerceOverview,
  loadOrder,
  handleAddToCart,
  handleAddToWishlist,
  handleUpdateCartQuantity,
  handleRemoveCartItem,
  handleApplyCoupon
} = commerce;

const {
  loadingTarget,
  runningProbe,
  loadingRuntimeDiagnostics,
  devTarget,
  devProbeResult,
  devProbeError,
  probeKeyword,
  probeEmployeeId,
  probeItemId,
  refreshDevTarget,
  runProbe,
  fetchRuntimeDiagnostics
} = developerTools;

function scrollChatToBottom(behavior = 'auto') {
  const messageList = document.querySelector('.message-row:last-child');
  if (messageList) {
    messageList.scrollIntoView({ behavior, block: 'end' });
    return;
  }

  const chatViewport = document.querySelector('main');
  chatViewport?.scrollTo?.({ top: chatViewport.scrollHeight, behavior });
}

async function scrollChatViewport(behavior = 'auto') {
  await nextTick();
  scrollChatToBottom(behavior);
}

async function handleInlineOrderLoad(payload) {
  await loadOrder(payload?.orderId);

  if (payload?.messageId != null) {
    refreshInlineCommercePayload(payload.messageId);
  }
}

function handleInlineOrderLookupUpdate(payload) {
  updateInlineOrderLookup(payload);
}

function toggleToolMenu() {
  activeToolPanel.value = activeToolPanel.value === 'menu' ? '' : 'menu';
}

function openToolPanel(panel) {
  activeToolPanel.value = panel;
}

function closeToolPanel() {
  activeToolPanel.value = '';
}

async function selectMenu(menu) {
  activeMenu.value = menu;
  closeToolPanel();
  if (menu === 'developer' && !devTarget.value) {
    await refreshDevTarget();
  }
}

async function handleSendPrompt() {
  await sendPrompt({
    closeToolPanel,
    scrollToBottom: scrollChatViewport
  });
}

onMounted(() => {
  refreshDevTarget();
  refreshCommerceOverview();
});

watch(prompt, async (value) => {
  if (activeMenu.value !== 'chat' || !value) return;
  await scrollChatViewport('smooth');
});

watch(
  () => messages.value.map((message) => `${message.id}:${message.loading ? '1' : '0'}:${message.text}`).join('|'),
  async () => {
    if (activeMenu.value !== 'chat') return;
    await scrollChatViewport('smooth');
  }
);
</script>

<template>
  <div class="min-h-screen">
    <aside class="hidden md:flex flex-col h-screen w-64 bg-slate-50 border-r border-slate-100 p-4 gap-2 fixed left-0 top-0 z-40">
      <div class="mb-6 px-2">
        <h1 class="text-lg font-black text-blue-700 tracking-tighter">Aura Commerce</h1>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Developer Console</p>
      </div>

      <nav class="flex flex-col gap-2 mb-4">
        <button
          class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium text-left"
          type="button"
        >
          <span class="material-symbols-outlined text-slate-400">home</span>
          <span>Home</span>
        </button>
        <button
          class="flex items-center gap-3 px-4 py-3 transition-colors text-sm font-medium rounded-lg text-left"
          :class="activeMenu === 'chat' ? 'text-blue-700 bg-white shadow-sm' : 'text-slate-600 hover:text-blue-600'"
          type="button"
          @click="selectMenu('chat')"
        >
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">smart_toy</span>
          <span>Chat</span>
        </button>
        <button
          class="flex items-center gap-3 px-4 py-3 transition-colors text-sm font-medium rounded-lg text-left"
          :class="activeMenu === 'developer' ? 'text-blue-700 bg-white shadow-sm' : 'text-slate-600 hover:text-blue-600'"
          type="button"
          @click="selectMenu('developer')"
        >
          <span class="material-symbols-outlined text-slate-400">terminal</span>
          <span>Developer</span>
        </button>
      </nav>

      <section class="mt-auto p-3 bg-white rounded-2xl shadow-[0_12px_40px_rgba(25,28,29,0.05)] border border-slate-100 flex flex-col gap-1">
        <p class="text-xs font-bold text-slate-900">Current View</p>
        <p class="text-[11px] text-slate-600">
          {{ activeMenu === 'developer' ? 'Developer API Console' : 'Chat Assistant' }}
        </p>
      </section>
    </aside>

    <main class="md:ml-64 min-h-screen relative overflow-hidden">
      <AppHeader />

      <template v-if="activeMenu === 'chat'">
        <ChatMessageList
          :messages="messages"
          :loading-order="orderLoading"
          :pending-product-id="pendingProductId"
          @add-to-cart="handleAddToCart"
          @add-to-wishlist="handleAddToWishlist"
          @update:order-lookup-id="handleInlineOrderLookupUpdate"
          @load-order="handleInlineOrderLoad"
        />
        <CommerceDeskPanel
          :open="activeToolPanel === 'commerce-desk'"
          :customer-profile="customerProfile"
          :loyalty-summary="loyaltySummary"
          :available-coupons="availableCoupons"
          @close="closeToolPanel"
        />
        <ConversationRecordPanel
          :open="activeToolPanel === 'conversation-record'"
          :conversation-history="conversationHistory"
          @close="closeToolPanel"
        />
        <ToolMenuPanel
          :open="activeToolPanel === 'menu'"
          @close="closeToolPanel"
          @select="openToolPanel"
        />
        <AiClipboardDrawer
          :cart="cart"
          :coupons="availableCoupons"
          :loading="commerceLoading"
          :busy-item-id="busyCartItemId"
          :applying-coupon="applyingCoupon"
          :coupon-code="couponCode"
          @update-quantity="handleUpdateCartQuantity"
          @remove-item="handleRemoveCartItem"
          @update:coupon-code="couponCode = $event"
          @apply-coupon="handleApplyCoupon"
        />
        <ChatInputBar v-model="prompt" :sending="sending" @send="handleSendPrompt" @toggle-tool-menu="toggleToolMenu" />
      </template>

      <DeveloperConsole
        v-else
        :loading-target="loadingTarget"
        :loading-runtime-diagnostics="loadingRuntimeDiagnostics"
        :running-probe="runningProbe"
        :dev-target="devTarget"
        :dev-probe-result="devProbeResult"
        :dev-probe-error="devProbeError"
        :probe-keyword="probeKeyword"
        :probe-employee-id="probeEmployeeId"
        :probe-item-id="probeItemId"
        @refresh-target="refreshDevTarget"
        @fetch-runtime-diagnostics="fetchRuntimeDiagnostics"
        @run-probe="runProbe"
        @update:probe-keyword="probeKeyword = $event"
        @update:probe-employee-id="probeEmployeeId = $event"
        @update:probe-item-id="probeItemId = $event"
      />
    </main>

    <nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-2xl rounded-t-3xl border-t border-slate-100/60 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      <button class="flex flex-col items-center justify-center text-slate-400 px-5 py-2" type="button">
        <span class="material-symbols-outlined">home</span>
        <span class="text-[11px] font-semibold uppercase tracking-widest mt-1">Home</span>
      </button>
      <button
        class="flex flex-col items-center justify-center rounded-2xl px-5 py-2"
        :class="activeMenu === 'chat' ? 'bg-blue-50 text-blue-700' : 'text-slate-400'"
        type="button"
        @click="selectMenu('chat')"
      >
        <span class="material-symbols-outlined" :style="activeMenu === 'chat' ? 'font-variation-settings: \'FILL\' 1' : ''">smart_toy</span>
        <span class="text-[11px] font-semibold uppercase tracking-widest mt-1">Chat</span>
      </button>
      <button
        class="flex flex-col items-center justify-center rounded-2xl px-5 py-2"
        :class="activeMenu === 'developer' ? 'bg-blue-50 text-blue-700' : 'text-slate-400'"
        type="button"
        @click="selectMenu('developer')"
      >
        <span class="material-symbols-outlined" :style="activeMenu === 'developer' ? 'font-variation-settings: \'FILL\' 1' : ''">terminal</span>
        <span class="text-[11px] font-semibold uppercase tracking-widest mt-1">Dev</span>
      </button>
    </nav>
  </div>
</template>
