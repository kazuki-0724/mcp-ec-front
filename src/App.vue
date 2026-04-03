<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import ChatInputBar from './components/ChatInputBar.vue';
import AiClipboardDrawer from './components/AiClipboardDrawer.vue';
import CommerceDeskPanel from './components/CommerceDeskPanel.vue';
import { postChat } from './services/chatApi.js';
import {
  addItemToCart,
  addItemToWishlist,
  applyCouponToCart,
  getAvailableCoupons,
  getCart,
  getCustomerProfile,
  getFeaturedProducts,
  getLoyaltySummary,
  getOrderDetails,
  getOrderHistory,
  getWishlist,
  removeItemFromCart,
  updateCartItemQuantity
} from './services/commerceApi.js';

const prompt = ref('');
const sending = ref(false);
const loadingTarget = ref(false);
const runningProbe = ref(false);
const loadingRuntimeDiagnostics = ref(false);
const devTarget = ref(null);
const devProbeResult = ref('');
const devProbeError = ref('');
const probeKeyword = ref('カレー');
const probeEmployeeId = ref('E001');
const probeItemId = ref('G005');
const activeMenu = ref('chat');
const activeCustomerId = ref('C001');
const customerProfile = ref(null);
const loyaltySummary = ref(null);
const featuredProducts = ref([]);
const wishlist = ref({ items: [] });
const cart = ref(null);
const availableCoupons = ref([]);
const orderHistory = ref([]);
const orderDetails = ref(null);
const orderLookupId = ref('O1001');
const commerceLoading = ref(false);
const orderLoading = ref(false);
const pendingProductId = ref('');
const busyCartItemId = ref('');
const applyingCoupon = ref(false);
const couponCode = ref('');
const commerceStatusMessage = ref('');
const commerceErrorMessage = ref('');
const isCommerceDeskOpen = ref(false);
const messages = ref([
  {
    id: 0,
    role: 'ai',
    text: 'こんにちは。社員情報やレシピ材料の取得に対応しています。例: カレーの材料をカゴに追加して。',
    loading: false
  }
]);

let messageSeq = 1;

function scrollChatToBottom(behavior = 'auto') {
  const messageList = document.querySelector('.message-row:last-child');
  if (messageList) {
    messageList.scrollIntoView({ behavior, block: 'end' });
    return;
  }

  const chatViewport = document.querySelector('main');
  chatViewport?.scrollTo?.({ top: chatViewport.scrollHeight, behavior });
}

function createEmptyCommerceSections() {
  return {
    customer: false,
    orders: false,
    featured: false,
    wishlist: false
  };
}

function inferCommerceSectionsFromPrompt(promptText) {
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

function hasVisibleCommerceSections(sections) {
  return Object.values(sections || {}).some(Boolean);
}

function cloneCommerceSnapshot() {
  return JSON.parse(JSON.stringify({
    customerProfile: customerProfile.value,
    loyaltySummary: loyaltySummary.value,
    featuredProducts: featuredProducts.value,
    wishlist: wishlist.value,
    orderHistory: orderHistory.value,
    orderDetails: orderDetails.value,
    orderLookupId: orderLookupId.value
  }));
}

function buildInlineCommercePayload(messageId, sections) {
  if (!hasVisibleCommerceSections(sections) && !commerceStatusMessage.value && !commerceErrorMessage.value) {
    return null;
  }

  const snapshot = cloneCommerceSnapshot();
  return {
    messageId,
    sections,
    customerProfile: snapshot.customerProfile,
    loyaltySummary: snapshot.loyaltySummary,
    featuredProducts: snapshot.featuredProducts,
    wishlist: snapshot.wishlist,
    orderHistory: snapshot.orderHistory,
    orderDetails: snapshot.orderDetails,
    orderLookupId: snapshot.orderLookupId,
    statusMessage: commerceStatusMessage.value,
    errorMessage: commerceErrorMessage.value
  };
}

function inferCommerceSectionsFromToolExecutions(toolExecutions = []) {
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

function replaceFeaturedProducts(products = []) {
  featuredProducts.value = Array.isArray(products) ? products : [];
}

function applyChatToolExecutions(toolExecutions = []) {
  let cartTouched = false;
  let wishlistTouched = false;
  let orderTouched = false;

  for (const execution of toolExecutions) {
    const result = execution?.result;
    if (!result || typeof result !== 'object') continue;

    switch (execution.name) {
      case 'get_cart':
      case 'add_item_to_cart':
      case 'update_cart_item_quantity':
      case 'remove_item_from_cart':
      case 'apply_coupon_to_cart':
        cart.value = result;
        cartTouched = true;
        break;
      case 'get_available_coupons':
        availableCoupons.value = result.coupons || [];
        break;
      case 'get_customer_profile':
        customerProfile.value = result;
        break;
      case 'get_loyalty_summary':
        loyaltySummary.value = result;
        break;
      case 'get_wishlist':
      case 'add_item_to_wishlist':
        wishlist.value = result;
        wishlistTouched = true;
        break;
      case 'get_order_history':
        orderHistory.value = result.orders || [];
        orderTouched = true;
        break;
      case 'get_order_details':
        orderDetails.value = result;
        orderLookupId.value = result.orderId || orderLookupId.value;
        orderTouched = true;
        break;
      case 'get_featured_products':
      case 'get_recommended_products':
      case 'search_products':
      case 'get_category_products':
      case 'get_brand_products':
        replaceFeaturedProducts(result.products || []);
        break;
      case 'get_product_details':
        replaceFeaturedProducts(result.itemId ? [result] : []);
        break;
      default:
        break;
    }
  }

  if (cartTouched) {
    setCommerceStatus('チャット操作の結果をカートへ反映しました。');
  } else if (wishlistTouched) {
    setCommerceStatus('チャット操作の結果をお気に入りへ反映しました。');
  } else if (orderTouched) {
    setCommerceStatus('チャット操作の結果を注文照会UIへ反映しました。');
  }
}

function setCommerceStatus(message) {
  commerceStatusMessage.value = message;
  commerceErrorMessage.value = '';
}

function setCommerceError(message) {
  commerceStatusMessage.value = '';
  commerceErrorMessage.value = message;
}

async function refreshCommerceOverview() {
  commerceLoading.value = true;
  commerceErrorMessage.value = '';

  try {
    const [profile, loyalty, featured, nextWishlist, nextCart, orders] = await Promise.all([
      getCustomerProfile(activeCustomerId.value),
      getLoyaltySummary(activeCustomerId.value),
      getFeaturedProducts(6),
      getWishlist(activeCustomerId.value),
      getCart(),
      getOrderHistory(activeCustomerId.value, 4)
    ]);
    const coupons = await getAvailableCoupons(profile?.tier || 'bronze');

    customerProfile.value = profile;
    loyaltySummary.value = loyalty;
    featuredProducts.value = featured.products || [];
    wishlist.value = nextWishlist;
    cart.value = nextCart;
    availableCoupons.value = coupons.coupons || [];
    orderHistory.value = orders.orders || [];

    if (orderHistory.value.length > 0) {
      const defaultOrderId = orderLookupId.value || orderHistory.value[0].orderId;
      orderLookupId.value = defaultOrderId;
      orderDetails.value = await getOrderDetails(defaultOrderId);
    }
  } catch (error) {
    setCommerceError(`ECデータの取得に失敗しました: ${error.message}`);
  } finally {
    commerceLoading.value = false;
  }
}

async function loadOrder(orderId) {
  const resolvedOrderId = String(orderId || orderLookupId.value || '').trim();
  if (!resolvedOrderId) return;

  orderLoading.value = true;

  try {
    orderDetails.value = await getOrderDetails(resolvedOrderId);
    orderLookupId.value = resolvedOrderId;
    setCommerceStatus(`注文 ${resolvedOrderId} を読み込みました。`);
  } catch (error) {
    setCommerceError(`注文照会に失敗しました: ${error.message}`);
  } finally {
    orderLoading.value = false;
  }
}

async function handleInlineOrderLoad(payload) {
  await loadOrder(payload?.orderId);

  if (payload?.messageId != null) {
    const message = messages.value.find((entry) => entry.id === payload.messageId);
    if (message?.inlineCommerce) {
      updateMessage(payload.messageId, {
        inlineCommerce: buildInlineCommercePayload(payload.messageId, message.inlineCommerce.sections)
      });
    }
  }
}

function handleInlineOrderLookupUpdate(payload) {
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

function toggleCommerceDesk() {
  isCommerceDeskOpen.value = !isCommerceDeskOpen.value;
}

async function handleAddToCart(itemId, quantity = 1) {
  pendingProductId.value = itemId;

  try {
    cart.value = await addItemToCart(itemId, quantity);
    setCommerceStatus('商品をカートに追加しました。');
  } catch (error) {
    setCommerceError(`カート追加に失敗しました: ${error.message}`);
  } finally {
    pendingProductId.value = '';
  }
}

async function handleAddToWishlist(itemId) {
  pendingProductId.value = itemId;

  try {
    wishlist.value = await addItemToWishlist(activeCustomerId.value, itemId);
    setCommerceStatus('商品をお気に入りに追加しました。');
  } catch (error) {
    setCommerceError(`お気に入り追加に失敗しました: ${error.message}`);
  } finally {
    pendingProductId.value = '';
  }
}

async function handleUpdateCartQuantity({ itemId, quantity }) {
  busyCartItemId.value = itemId;

  try {
    cart.value = await updateCartItemQuantity(itemId, quantity);
    setCommerceStatus('カート数量を更新しました。');
  } catch (error) {
    setCommerceError(`カート更新に失敗しました: ${error.message}`);
  } finally {
    busyCartItemId.value = '';
  }
}

async function handleRemoveCartItem(itemId) {
  busyCartItemId.value = itemId;

  try {
    cart.value = await removeItemFromCart(itemId);
    setCommerceStatus('商品をカートから削除しました。');
  } catch (error) {
    setCommerceError(`カート削除に失敗しました: ${error.message}`);
  } finally {
    busyCartItemId.value = '';
  }
}

async function handleApplyCoupon() {
  const trimmedCoupon = couponCode.value.trim();
  if (!trimmedCoupon) return;

  applyingCoupon.value = true;

  try {
    cart.value = await applyCouponToCart(trimmedCoupon);
    setCommerceStatus(`クーポン ${trimmedCoupon} を適用しました。`);
  } catch (error) {
    setCommerceError(`クーポン適用に失敗しました: ${error.message}`);
  } finally {
    applyingCoupon.value = false;
  }
}

async function refreshDevTarget() {
  loadingTarget.value = true;
  devProbeError.value = '';

  try {
    const res = await fetch('/api/dev/external-target');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'target取得に失敗しました。');
    devTarget.value = data;
  } catch (error) {
    devProbeError.value = `target取得エラー: ${error.message}`;
  } finally {
    loadingTarget.value = false;
  }
}

async function runProbe(operation) {
  if (runningProbe.value) return;

  const variablesByOperation = {
    recipe: { keyword: probeKeyword.value.trim() || 'カレー' },
    employee: { employeeId: probeEmployeeId.value.trim() || 'E001' },
    item: { itemId: probeItemId.value.trim() || 'G005' }
  };

  runningProbe.value = true;
  devProbeError.value = '';

  try {
    const res = await fetch('/api/dev/graphql-probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        variables: variablesByOperation[operation]
      })
    });

    const data = await res.json();
    devProbeResult.value = JSON.stringify(data, null, 2);
    if (!res.ok) {
      throw new Error(data?.error || `probe失敗 status=${res.status}`);
    }
  } catch (error) {
    devProbeError.value = `probeエラー: ${error.message}`;
  } finally {
    runningProbe.value = false;
  }
}

async function fetchRuntimeDiagnostics() {
  if (loadingRuntimeDiagnostics.value) return;

  loadingRuntimeDiagnostics.value = true;
  devProbeError.value = '';

  try {
    const res = await fetch('/api/dev/mcp-runtime-diagnostics');
    const data = await res.json();
    devProbeResult.value = JSON.stringify(data, null, 2);
    if (!res.ok) {
      throw new Error(data?.error || `runtime diagnostics失敗 status=${res.status}`);
    }
  } catch (error) {
    devProbeError.value = `runtime diagnosticsエラー: ${error.message}`;
  } finally {
    loadingRuntimeDiagnostics.value = false;
  }
}

async function selectMenu(menu) {
  activeMenu.value = menu;
  if (menu === 'developer' && !devTarget.value) {
    await refreshDevTarget();
  }
}

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

async function sendPrompt() {
  const trimmedPrompt = prompt.value.trim();
  if (!trimmedPrompt || sending.value) return;

  commerceStatusMessage.value = '';
  commerceErrorMessage.value = '';

  const requestedSections = inferCommerceSectionsFromPrompt(trimmedPrompt);

  createMessage('user', trimmedPrompt);
  prompt.value = '';

  const loadingMessageId = createMessage('ai', '考え中...', true);
  sending.value = true;

  await nextTick();
  scrollChatToBottom('smooth');

  try {
    const data = await postChat(trimmedPrompt);
    const toolExecutions = Array.isArray(data.toolExecutions) ? data.toolExecutions : [];
    const inferredSections = inferCommerceSectionsFromToolExecutions(toolExecutions);
    const combinedSections = {
      customer: requestedSections.customer || inferredSections.customer,
      orders: requestedSections.orders || inferredSections.orders,
      featured: requestedSections.featured || inferredSections.featured,
      wishlist: requestedSections.wishlist || inferredSections.wishlist
    };

    applyChatToolExecutions(toolExecutions);

    updateMessage(loadingMessageId, {
      text: data.text || data.error || '回答を取得できませんでした。',
      inlineCommerce: buildInlineCommercePayload(loadingMessageId, combinedSections)
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

onMounted(() => {
  refreshDevTarget();
  refreshCommerceOverview();
});

watch(prompt, async (value) => {
  if (activeMenu.value !== 'chat' || !value) return;
  await nextTick();
  scrollChatToBottom('smooth');
});

watch(
  () => messages.value.map((message) => `${message.id}:${message.loading ? '1' : '0'}:${message.text}`).join('|'),
  async () => {
    if (activeMenu.value !== 'chat') return;
    await nextTick();
    scrollChatToBottom('smooth');
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
          :open="isCommerceDeskOpen"
          :customer-profile="customerProfile"
          :loyalty-summary="loyaltySummary"
          :available-coupons="availableCoupons"
          @close="isCommerceDeskOpen = false"
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
        <ChatInputBar v-model="prompt" :sending="sending" @send="sendPrompt" @toggle-commerce-desk="toggleCommerceDesk" />
      </template>

      <section v-else class="pt-24 pb-28 md:pb-10 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto">
        <section class="bg-white rounded-3xl p-6 shadow-[0_12px_40px_rgba(25,28,29,0.05)] border border-slate-100">
          <div class="flex flex-wrap gap-3 items-center justify-between mb-5">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Developer Menu</h2>
              <p class="text-sm text-slate-500">MCPが使う向き先へ直接GraphQLを送信して確認します。</p>
            </div>
            <button class="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold disabled:opacity-60" :disabled="loadingTarget" @click="refreshDevTarget">
              {{ loadingTarget ? '向き先更新中...' : '向き先を更新' }}
            </button>
          </div>

          <div class="grid sm:grid-cols-3 gap-3 mb-6">
            <div class="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p class="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">mode</p>
              <p class="text-sm font-bold text-slate-900 mt-1">{{ devTarget?.mode || '-' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 border border-slate-100 p-3 sm:col-span-2">
              <p class="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">endpoint</p>
              <p class="text-sm font-bold text-slate-900 mt-1 break-all">{{ devTarget?.endpoint || '(未設定)' }}</p>
            </div>
          </div>

          <div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-900">MCP Child Runtime Diagnostics</p>
                <p class="text-xs text-slate-600">親プロセスではなく、MCP 子プロセス自身が見ている mode / endpoint / env を取得します。</p>
              </div>
              <button class="text-sm font-bold px-3 py-2 rounded-lg bg-amber-500 text-white disabled:opacity-60" :disabled="loadingRuntimeDiagnostics" @click="fetchRuntimeDiagnostics">
                {{ loadingRuntimeDiagnostics ? '取得中...' : '子プロセス診断を実行' }}
              </button>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div class="rounded-xl border border-slate-200 p-3">
              <p class="text-xs font-bold text-slate-800 mb-2">Recipe Probe</p>
              <input v-model="probeKeyword" class="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2" placeholder="keyword" type="text" />
              <button class="w-full text-sm font-bold px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60" :disabled="runningProbe" @click="runProbe('recipe')">
                Run RecipeByKeyword
              </button>
            </div>

            <div class="rounded-xl border border-slate-200 p-3">
              <p class="text-xs font-bold text-slate-800 mb-2">Employee Probe</p>
              <input v-model="probeEmployeeId" class="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2" placeholder="employeeId" type="text" />
              <button class="w-full text-sm font-bold px-3 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-60" :disabled="runningProbe" @click="runProbe('employee')">
                Run EmployeeById
              </button>
            </div>

            <div class="rounded-xl border border-slate-200 p-3">
              <p class="text-xs font-bold text-slate-800 mb-2">Item Probe</p>
              <input v-model="probeItemId" class="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2" placeholder="itemId" type="text" />
              <button class="w-full text-sm font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60" :disabled="runningProbe" @click="runProbe('item')">
                Run ItemById
              </button>
            </div>
          </div>

          <p v-if="devProbeError" class="text-sm text-red-600 mt-4">{{ devProbeError }}</p>
          <pre v-if="devProbeResult" class="mt-4 max-h-[420px] overflow-auto text-xs leading-5 p-4 rounded-xl bg-slate-950 text-slate-100">{{ devProbeResult }}</pre>
        </section>
      </section>
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
