<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close', 'select']);

const toolItems = [
  {
    id: 'commerce-desk',
    title: 'Commerce Desk',
    description: '会員情報やクーポン、推奨操作を確認します。',
    icon: 'storefront'
  },
  {
    id: 'conversation-record',
    title: 'Conversation Record',
    description: 'このページを開いてからの会話記録を確認します。',
    icon: 'history'
  }
];
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
      class="fixed bottom-[132px] md:bottom-[108px] left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-[80] w-[min(92vw,24rem)] rounded-[2rem] border border-white/70 bg-white/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.16)]"
    >
      <div class="p-5 sm:p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Tools</p>
            <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">表示するツールを選択</h3>
          </div>
          <button class="w-10 h-10 rounded-full shrink-0 bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center" type="button" aria-label="閉じる" @click="$emit('close')">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div class="mt-5 space-y-3">
          <button
            v-for="tool in toolItems"
            :key="tool.id"
            class="w-full rounded-[1.4rem] border border-slate-200 bg-slate-50/90 px-4 py-4 text-left hover:border-blue-200 hover:bg-blue-50/60 transition-colors"
            type="button"
            @click="$emit('select', tool.id)"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                <span class="material-symbols-outlined">{{ tool.icon }}</span>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900">{{ tool.title }}</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">{{ tool.description }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  </transition>
</template>