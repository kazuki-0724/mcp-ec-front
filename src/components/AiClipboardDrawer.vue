<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  cart: {
    type: Object,
    default: null
  },
  coupons: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  busyItemId: {
    type: String,
    default: ''
  },
  applyingCoupon: {
    type: Boolean,
    default: false
  },
  couponCode: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update-quantity', 'remove-item', 'update:couponCode', 'apply-coupon']);

const isOpen = ref(false);
const cartItems = computed(() => props.cart?.items || []);
const totalQty = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));
const totalPrice = computed(() => props.cart?.summary?.grandTotal || 0);

function openDrawer() {
  isOpen.value = true;
}

function closeDrawer() {
  isOpen.value = false;
}

function formatYen(value) {
  return `¥${Number(value || 0).toLocaleString('ja-JP')}`;
}

function changeQuantity(item, delta) {
  emit('update-quantity', {
    itemId: item.itemId,
    quantity: Math.max(0, item.quantity + delta)
  });
}

function removeItem(itemId) {
  emit('remove-item', itemId);
}

function updateCouponCode(event) {
  emit('update:couponCode', event.target.value);
}
</script>

<template>
  <div class="pointer-events-none">
    <div class="fixed left-0 right-0 md:left-64 bottom-[208px] md:bottom-28 p-4 md:p-6 z-40">
      <div class="max-w-4xl mx-auto w-full flex justify-end">
        <button
          class="pointer-events-auto w-14 h-14 bg-white rounded-full shadow-lg border border-slate-100 inline-flex items-center justify-center group hover:scale-105 transition-transform"
          type="button"
          aria-label="AIのお預かりリストを開く"
          @click="openDrawer"
        >
          <span class="relative inline-flex items-center justify-center">
            <span class="material-symbols-outlined text-blue-600 leading-none">inventory_2</span>
            <span class="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
              {{ totalQty }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="isOpen"
        class="pointer-events-auto fixed inset-0 md:left-64 bg-black/40 backdrop-blur-sm z-[55]"
        type="button"
        aria-label="ドロワーを閉じる"
        @click="closeDrawer"
      ></button>
    </transition>

    <transition
      enter-active-class="transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <section
        v-if="isOpen"
        class="pointer-events-auto fixed bottom-0 left-0 right-0 md:left-64 bg-white rounded-t-[2rem] shadow-2xl z-[60] flex flex-col h-[75%]"
      >
        <header class="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <div class="flex items-center gap-3">
            <div class="bg-blue-50 p-2 rounded-full">
              <span class="material-symbols-outlined text-blue-600 text-[20px]">content_paste</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-sm">AIのお預かりリスト</h3>
              <p class="text-[10px] text-gray-500">AIが保持しているカート候補と現在の注文内容</p>
            </div>
          </div>
          <button class="w-10 h-10 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center shrink-0" type="button" aria-label="閉じる" @click="closeDrawer">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-5 no-scrollbar">
          <p class="text-sm text-gray-700 mb-4 bg-blue-50 p-3 rounded-xl rounded-tl-sm">
            こちらの内容でご準備を進めてよろしいでしょうか？
          </p>

          <div class="grid sm:grid-cols-3 gap-3 mb-5">
            <article class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Items</p>
              <p class="text-lg font-bold text-slate-900 mt-2">{{ totalQty }}</p>
            </article>
            <article class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Discount</p>
              <p class="text-lg font-bold text-slate-900 mt-2">{{ formatYen(cart?.summary?.couponDiscount || 0) }}</p>
            </article>
            <article class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Shipping</p>
              <p class="text-lg font-bold text-slate-900 mt-2">{{ formatYen(cart?.summary?.shippingFee || 0) }}</p>
            </article>
          </div>

          <div v-if="loading" class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            カートを同期しています...
          </div>

          <div v-else-if="cartItems.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
            まだカートに商品がありません。下のおすすめやお気に入りから追加できます。
          </div>

          <div v-else class="space-y-4">
            <article v-for="item in cartItems" :key="item.itemId" class="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div class="flex justify-between items-start gap-3">
                <div class="flex gap-3 items-center min-w-0">
                  <div class="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                    <span class="material-symbols-outlined text-[16px]">shopping_bag</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ item.itemName }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ formatYen(item.unitPrice) }} × {{ item.quantity }} {{ item.unit }}</p>
                    <p v-if="item.discountAmount > 0" class="text-[11px] text-blue-700 font-semibold mt-1">値引き {{ formatYen(item.discountAmount) }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-sm text-gray-900">{{ formatYen(item.subtotal) }}</p>
                  <button class="mt-2 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors" type="button" :disabled="busyItemId === item.itemId" @click="removeItem(item.itemId)">
                    削除
                  </button>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between">
                <div class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 gap-1">
                  <button class="w-8 h-8 rounded-full bg-white text-slate-600 disabled:opacity-50" type="button" :disabled="busyItemId === item.itemId" @click="changeQuantity(item, -1)">
                    <span class="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span class="min-w-8 text-center text-sm font-semibold text-slate-800">{{ item.quantity }}</span>
                  <button class="w-8 h-8 rounded-full bg-white text-slate-600 disabled:opacity-50" type="button" :disabled="busyItemId === item.itemId" @click="changeQuantity(item, 1)">
                    <span class="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
                <span v-if="busyItemId === item.itemId" class="text-xs font-semibold text-blue-700">更新中...</span>
              </div>
            </article>
          </div>

          <div class="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-3 mb-3">
              <div>
                <p class="text-sm font-bold text-slate-900">クーポン</p>
                <p class="text-xs text-slate-500">会員向けの割引コードをそのまま適用できます。</p>
              </div>
              <span class="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Promo</span>
            </div>

            <div class="flex gap-2">
              <input
                :value="couponCode"
                class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                placeholder="WELCOME10"
                type="text"
                @input="updateCouponCode"
              />
              <button class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" type="button" :disabled="applyingCoupon" @click="$emit('apply-coupon')">
                {{ applyingCoupon ? '適用中...' : '適用' }}
              </button>
            </div>

            <div v-if="coupons.length > 0" class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="coupon in coupons"
                :key="coupon.couponCode"
                class="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700"
                type="button"
                @click="$emit('update:couponCode', coupon.couponCode)"
              >
                {{ coupon.couponCode }}
              </button>
            </div>
          </div>
        </div>

        <footer class="p-5 border-t border-gray-100 bg-white pb-8 shrink-0">
          <div class="space-y-2 mb-4 text-sm">
            <div class="flex justify-between items-center text-slate-500">
              <span>小計</span>
              <span>{{ formatYen(cart?.summary?.subtotal || 0) }}</span>
            </div>
            <div class="flex justify-between items-center text-slate-500">
              <span>送料</span>
              <span>{{ formatYen(cart?.summary?.shippingFee || 0) }}</span>
            </div>
            <div class="flex justify-between items-end">
              <span class="text-sm font-medium text-gray-500">合計 (税込)</span>
              <span class="font-bold text-2xl text-gray-900">{{ formatYen(totalPrice) }}</span>
            </div>
          </div>
          <button class="w-full bg-blue-600 text-white rounded-xl py-3.5 font-bold text-sm shadow-md hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-60" type="button" :disabled="cartItems.length === 0">
            注文内容を確認する
          </button>
        </footer>
      </section>
    </transition>
  </div>
</template>
