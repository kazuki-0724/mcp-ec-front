<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  sending: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'send', 'toggle-tool-menu']);

function onKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    emit('send');
  }
}
</script>

<template>
  <footer class="fixed bottom-0 right-0 left-0 md:left-64 p-4 md:p-6 pb-[120px] md:pb-6 bg-gradient-to-t from-surface via-surface to-transparent pointer-events-none z-30">
    <div class="max-w-4xl mx-auto w-full pointer-events-auto">
      <div class="bg-white/90 backdrop-blur-2xl rounded-3xl p-2 shadow-[0_12px_40px_rgba(25,28,29,0.1)] border border-outline-variant/20 flex items-center gap-2">
        <button class="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors" type="button" aria-label="ツールを開く" @click="emit('toggle-tool-menu')">
          <span class="material-symbols-outlined">build_circle</span>
        </button>
        <input
          class="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-slate-400 text-sm py-3 px-2"
          placeholder="例: カレーの材料をカゴに追加して"
          type="text"
          :value="modelValue"
          @input="emit('update:modelValue', $event.target.value)"
          @keydown="onKeydown"
        />
        <button
          class="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-60"
          type="button"
          aria-label="送信"
          :disabled="sending"
          @click="emit('send')"
        >
          <span class="material-symbols-outlined text-sm">arrow_upward</span>
        </button>
      </div>
    </div>
  </footer>
</template>
