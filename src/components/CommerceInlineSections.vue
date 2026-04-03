<script setup>
const props = defineProps({
  payload: {
    type: Object,
    default: null
  },
  loadingOrder: {
    type: Boolean,
    default: false
  },
  pendingProductId: {
    type: String,
    default: ''
  }
});

defineEmits(['add-to-cart', 'add-to-wishlist', 'update:orderLookupId', 'load-order']);

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
  <section v-if="payload" class="mt-3 w-full space-y-3">
    <p v-if="payload.statusMessage" class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {{ payload.statusMessage }}
    </p>
    <p v-if="payload.errorMessage" class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ payload.errorMessage }}
    </p>

    <section v-if="payload.sections?.customer && payload.customerProfile" class="rounded-[1.6rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.28em] text-blue-700 font-semibold">Commerce Desk</p>
          <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">{{ payload.customerProfile.fullName }}</h3>
          <p class="mt-2 text-sm text-slate-500">会員情報とロイヤルティ状況を確認できます。</p>
        </div>
        <div class="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 min-w-[160px]">
          <p class="text-[10px] uppercase tracking-[0.26em] text-slate-400 font-semibold">Loyalty</p>
          <p class="mt-2 text-lg font-bold text-slate-900">{{ payload.loyaltySummary?.tier || payload.customerProfile.tier || '-' }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ payload.loyaltySummary?.points || 0 }} points</p>
        </div>
      </div>
    </section>

    <section v-if="payload.sections?.orders" class="rounded-[1.6rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Order Lookup</p>
          <h3 class="mt-2 text-lg font-bold text-slate-900">注文照会</h3>
        </div>
        <span class="text-xs font-semibold text-slate-400">Inline</span>
      </div>

      <div class="mt-4 flex gap-2">
        <input
          :value="payload.orderLookupId || ''"
          class="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
          placeholder="O1001"
          type="text"
          @input="$emit('update:orderLookupId', { messageId: payload.messageId, value: $event.target.value })"
        />
        <button class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" type="button" :disabled="loadingOrder" @click="$emit('load-order', { messageId: payload.messageId, orderId: payload.orderLookupId })">
          {{ loadingOrder ? '照会中...' : '検索' }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="order in payload.orderHistory || []"
          :key="order.orderId"
          class="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700"
          type="button"
          @click="$emit('load-order', { messageId: payload.messageId, orderId: order.orderId })"
        >
          {{ order.orderId }}
        </button>
      </div>

      <article v-if="payload.orderDetails" class="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-slate-900">{{ payload.orderDetails.orderId }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ payload.orderDetails.orderedAt }}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-[11px] font-semibold" :class="statusTone(payload.orderDetails.status)">
            {{ payload.orderDetails.status }}
          </span>
        </div>

        <div class="mt-4 space-y-3">
          <div v-for="item in payload.orderDetails.items" :key="`${payload.orderDetails.orderId}-${item.itemId}`" class="flex items-center justify-between gap-3 text-sm">
            <div>
              <p class="font-medium text-slate-800">{{ item.itemName }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ item.quantity }}点</p>
            </div>
            <p class="font-bold text-slate-900">{{ formatYen(item.unitPrice * item.quantity) }}</p>
          </div>
        </div>
      </article>
    </section>

    <section v-if="payload.sections?.featured && (payload.featuredProducts || []).length > 0" class="rounded-[1.6rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Featured Shelf</p>
          <h3 class="mt-2 text-lg font-bold text-slate-900">おすすめ商品</h3>
        </div>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <article v-for="product in payload.featuredProducts" :key="product.itemId" class="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
          <p class="text-sm font-bold text-slate-900 leading-6">{{ product.itemName }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ product.categoryName }} ・ {{ product.brandName }}</p>
          <div class="mt-4 flex items-end justify-between gap-3">
            <div>
              <p class="text-lg font-black tracking-tight text-slate-900">{{ formatYen(product.unitPrice) }}</p>
              <p class="text-[11px] text-slate-400 mt-1">在庫 {{ product.stock }}</p>
            </div>
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

    <section v-if="payload.sections?.wishlist" class="rounded-[1.6rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(15,23,42,0.06)] p-5">
      <div class="flex items-center justify-between gap-3 mb-5">
        <div>
          <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Wishlist</p>
          <h3 class="mt-2 text-lg font-bold text-slate-900">お気に入り</h3>
        </div>
        <span class="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600">{{ payload.wishlist?.items?.length || 0 }} saved</span>
      </div>

      <div v-if="(payload.wishlist?.items?.length || 0) === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        まだお気に入りがありません。
      </div>

      <div v-else class="space-y-3">
        <article v-for="item in payload.wishlist.items" :key="item.itemId" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
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
  </section>
</template>