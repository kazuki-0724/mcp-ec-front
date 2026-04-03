<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  },
  customerProfile: {
    type: Object,
    default: null
  },
  loyaltySummary: {
    type: Object,
    default: null
  },
  availableCoupons: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close']);
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-[0.98]"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-[0.98]"
  >
    <section
      v-if="open"
      class="fixed bottom-[132px] md:bottom-[108px] left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-[80] w-[min(92vw,28rem)] md:w-[420px] max-h-[calc(100dvh-13rem)] md:max-h-[calc(100dvh-10rem)] rounded-[2rem] border border-white/70 bg-white/92 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.16)] overflow-y-auto no-scrollbar"
    >
      <div class="relative p-5 sm:p-6">
        <div class="rounded-[1.6rem] bg-gradient-to-r from-blue-100/70 via-white to-cyan-100/70 p-4 sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.28em] text-blue-700 font-semibold">Commerce Desk</p>
              <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">{{ customerProfile?.fullName || 'Guest Workspace' }}</h3>
            </div>
            <button class="w-10 h-10 rounded-full shrink-0 bg-white/90 border border-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center" type="button" aria-label="閉じる" @click="$emit('close')">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div class="mt-4">
          <p class="mt-2 text-sm text-slate-500">入力前に会員情報や保存済み特典を確認できるクイックパネルです。</p>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Tier</p>
            <p class="mt-2 text-lg font-bold text-slate-900">{{ loyaltySummary?.tier || customerProfile?.tier || '-' }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ loyaltySummary?.points || 0 }} points</p>
          </article>
          <article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-semibold">Address</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">{{ customerProfile?.defaultAddress?.prefecture || '-' }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ customerProfile?.defaultAddress?.city || '' }}</p>
          </article>
        </div>

        <div class="mt-5">
          <p class="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Suggested Prompts</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600">注文 O1001 を確認して</span>
            <span class="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600">お気に入りを見せて</span>
            <span class="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600">おすすめ商品を提案して</span>
          </div>
        </div>

        <div v-if="availableCoupons.length > 0" class="mt-5">
          <p class="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Available Coupons</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="coupon in availableCoupons.slice(0, 3)"
              :key="coupon.couponCode"
              class="rounded-full bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700"
            >
              {{ coupon.couponCode }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>