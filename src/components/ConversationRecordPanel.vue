<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  },
  conversationHistory: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close']);

function formatCalledTools(turn) {
  const names = Array.isArray(turn?.calledTools) && turn.calledTools.length > 0
    ? turn.calledTools
    : Array.isArray(turn?.toolExecutions)
      ? turn.toolExecutions.map((execution) => execution?.name).filter(Boolean)
      : [];

  return names.join(', ');
}
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
      class="fixed bottom-[132px] md:bottom-[108px] left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-[80] w-[min(92vw,30rem)] md:w-[460px] max-h-[calc(100dvh-13rem)] md:max-h-[calc(100dvh-10rem)] rounded-[2rem] border border-white/70 bg-white/92 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.16)] overflow-y-auto no-scrollbar"
    >
      <div class="p-5 sm:p-6">
        <div class="rounded-[1.6rem] bg-gradient-to-r from-amber-100/70 via-white to-orange-100/70 p-4 sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.28em] text-amber-700 font-semibold">Conversation Record</p>
              <h3 class="mt-2 text-xl font-black tracking-tight text-slate-900">会話の流れ</h3>
              <p class="mt-2 text-sm text-slate-500">このページを開いている間だけ保持する会話記録です。</p>
            </div>
            <button class="w-10 h-10 rounded-full shrink-0 bg-white/90 border border-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center" type="button" aria-label="閉じる" @click="$emit('close')">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div v-if="conversationHistory.length === 0" class="mt-5 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          まだ会話記録はありません。
        </div>

        <div v-else class="mt-5 space-y-3">
          <article v-for="turn in conversationHistory" :key="turn.turnId" class="rounded-[1.4rem] border border-slate-100 bg-slate-50/90 px-4 py-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Turn {{ turn.turnId }}</p>
              <span v-if="formatCalledTools(turn)" class="text-[11px] font-semibold text-blue-700">{{ formatCalledTools(turn) }}</span>
            </div>
            <p class="mt-3 text-xs font-semibold text-slate-500">User</p>
            <p class="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{{ turn.userPrompt }}</p>
            <p class="mt-3 text-xs font-semibold text-slate-500">Assistant</p>
            <p class="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{{ turn.assistantResponse }}</p>
          </article>
        </div>
      </div>
    </section>
  </transition>
</template>