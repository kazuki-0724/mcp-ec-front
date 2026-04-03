<script setup>
import { computed } from 'vue';

const props = defineProps({
  customerProfile: {
    type: Object,
    default: null
  },
  loyaltySummary: {
    type: Object,
    default: null
  },
  featuredProducts: {
    type: Array,
    default: () => []
  },
  wishlist: {
    type: Object,
    default: null
  },
  orderHistory: {
    type: Array,
    default: () => []
  },
  orderDetails: {
    type: Object,
    default: null
  },
  orderLookupId: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingOrder: {
    type: Boolean,
    default: false
  },
  pendingProductId: {
    type: String,
    default: ''
  },
  statusMessage: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  visibleSections: {
    type: Object,
    default: () => ({
      customer: false,
      orders: false,
      featured: false,
      wishlist: false
    })
  }
});

defineEmits(['add-to-cart', 'add-to-wishlist', 'update:orderLookupId', 'load-order']);

const hasVisibleContent = computed(() => {
  return Object.values(props.visibleSections || {}).some(Boolean) || Boolean(props.statusMessage) || Boolean(props.errorMessage);
});

function formatYen(value) {
  return `¥${Number(value || 0).toLocaleString('ja-JP')}`;
}

function statusTone(status) {
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (status === 'shipped') return 'bg-blue-50 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}
</script>

<template>
  <section v-if="hasVisibleContent" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 pb-36 md:pb-10">
    <div v-if="visibleSections.customer || statusMessage || errorMessage" class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section class="rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5 sm:p-6 overflow-hidden relative">
        <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-100/70 via-white to-cyan-100/70"></div>
        <div class="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-blue-700 font-semibold">Commerce Desk</p>
            <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900">{{ customerProfile?.fullName || 'ゲストユーザー' }}</h2>
            <p class="mt-2 text-sm text-slate-500">チャットと並行して、お気に入り・注文照会・カート操作をそのまま進められます。</p>
          </div>
          <div v-if="visibleSections.customer" class="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 min-w-[180px]">
            <p class="text-[10px] uppercase tracking-[0.26em] text-slate-400 font-semibold">Loyalty</p>
            <p class="mt-2 text-xl font-bold text-slate-900">{{ loyaltySummary?.tier || customerProfile?.tier || '-' }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ loyaltySummary?.points || 0 }} points</p>
          </div>
        </div>

        <div v-if="visibleSections.customer" class="mt-6 grid sm:grid-cols-3 gap-3">
          <article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Default Address</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ customerProfile?.defaultAddress?.prefecture || '-' }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ customerProfile?.defaultAddress?.city || '' }}</p>
          </article>
          <article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Favorites</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ wishlist?.items?.length || 0 }} items</p>
            <p class="text-xs text-slate-500 mt-1">よく使う商品を素早く再投入</p>
          </article>
          <article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Recent Orders</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ orderHistory.length }} records</p>
            <p class="text-xs text-slate-500 mt-1">配送状況と内訳を確認可能</p>
          </article>
        </div>

        <p v-if="statusMessage" class="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ statusMessage }}
        </p>
        <p v-if="errorMessage" class="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ errorMessage }}
        </p>
      </section>

      <section v-if="visibleSections.orders" class="rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Order Lookup</p>
            <h3 class="mt-2 text-lg font-bold text-slate-900">注文照会</h3>
          </div>
          <span class="text-xs font-semibold text-slate-400">Live</span>
        </div>

        <div class="mt-4 flex gap-2">
          <input
            :value="orderLookupId"
            class="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
            placeholder="O1001"
            type="text"
            @input="$emit('update:orderLookupId', $event.target.value)"
          />
          <button class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" type="button" :disabled="loadingOrder" @click="$emit('load-order', orderLookupId)">
            {{ loadingOrder ? '照会中...' : '検索' }}
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="order in orderHistory"
            :key="order.orderId"
            class="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700"
            type="button"
            @click="$emit('load-order', order.orderId)"
          >
            {{ order.orderId }}
          </button>
        </div>

        <article v-if="orderDetails" class="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-slate-900">{{ orderDetails.orderId }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ orderDetails.orderedAt }}</p>
            </div>
            <span class="rounded-full px-3 py-1 text-[11px] font-semibold" :class="statusTone(orderDetails.status)">
              {{ orderDetails.status }}
            </span>
          </div>

          <div class="mt-4 space-y-3">
            <div v-for="item in orderDetails.items" :key="`${orderDetails.orderId}-${item.itemId}`" class="flex items-center justify-between gap-3 text-sm">
              <div>
                <p class="font-medium text-slate-800">{{ item.itemName }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ item.quantity }}点</p>
              </div>
              <p class="font-bold text-slate-900">{{ formatYen(item.unitPrice * item.quantity) }}</p>
            </div>
          </div>

          <div class="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500 space-y-2">
            <div class="flex justify-between"><span>決済方法</span><span>{{ orderDetails.paymentMethod }}</span></div>
            <div class="flex justify-between"><span>合計</span><span class="font-bold text-slate-900">{{ formatYen(orderDetails.total) }}</span></div>
          </div>
        </article>
      </section>
    </div>

    <div v-if="visibleSections.featured || visibleSections.wishlist" class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] mt-5">
      <section v-if="visibleSections.featured" class="rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3 mb-5">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Featured Shelf</p>
            <h3 class="mt-2 text-lg font-bold text-slate-900">おすすめ商品</h3>
          </div>
          <span v-if="loading" class="text-xs font-semibold text-blue-700">同期中...</span>
        </div>

        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <article v-for="product in featuredProducts" :key="product.itemId" class="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
            <div class="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <span class="material-symbols-outlined">local_mall</span>
            </div>
            <p class="mt-4 text-sm font-bold text-slate-900 leading-6">{{ product.itemName }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ product.categoryName }} ・ {{ product.brandName }}</p>
            <div class="mt-4 flex items-end justify-between gap-3">
              <div>
                <p class="text-lg font-black tracking-tight text-slate-900">{{ formatYen(product.unitPrice) }}</p>
                <p class="text-[11px] text-slate-400 mt-1">在庫 {{ product.stock }}</p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{{ product.unit }}</span>
            </div>
            <div class="mt-4 flex gap-2">
              <button class="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" type="button" :disabled="pendingProductId === product.itemId" @click="$emit('add-to-cart', product.itemId)">
                {{ pendingProductId === product.itemId ? '追加中...' : 'カートへ' }}
              </button>
              <button class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60" type="button" :disabled="pendingProductId === product.itemId" @click="$emit('add-to-wishlist', product.itemId)">
                <span class="material-symbols-outlined text-[18px]">favorite</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="visibleSections.wishlist" class="rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3 mb-5">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Wishlist</p>
            <h3 class="mt-2 text-lg font-bold text-slate-900">お気に入り</h3>
          </div>
          <span class="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600">{{ wishlist?.items?.length || 0 }} saved</span>
        </div>

        <div v-if="(wishlist?.items?.length || 0) === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          まだお気に入りがありません。おすすめ棚からハートで追加できます。
        </div>

        <div v-else class="space-y-3">
          <article v-for="item in wishlist.items" :key="item.itemId" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-slate-900">{{ item.itemName }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ item.categoryName }} ・ {{ item.brandName }}</p>
              </div>
              <p class="text-sm font-black text-slate-900">{{ formatYen(item.unitPrice) }}</p>
            </div>
            <button class="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 disabled:opacity-60" type="button" :disabled="pendingProductId === item.itemId" @click="$emit('add-to-cart', item.itemId)">
              {{ pendingProductId === item.itemId ? '追加中...' : 'この商品をカートへ戻す' }}
            </button>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>