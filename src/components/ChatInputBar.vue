<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
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

const isSpeechSupported = ref(false);
const isRecording = ref(false);
const speechError = ref('');

const SILENCE_TIMEOUT_MS = 2600;
const MAX_RECORDING_MS = 45000;

let recognition = null;
let isIntendedStop = false;
let pendingInterimText = '';
let silenceTimerId = null;
let maxRecordingTimerId = null;

function clearSilenceTimer() {
  if (silenceTimerId) {
    clearTimeout(silenceTimerId);
    silenceTimerId = null;
  }
}

function clearMaxRecordingTimer() {
  if (maxRecordingTimerId) {
    clearTimeout(maxRecordingTimerId);
    maxRecordingTimerId = null;
  }
}

function stopRecordingAutomatically() {
  if (!isRecording.value || !recognition) return;
  isIntendedStop = true;
  recognition.stop();
}

function scheduleSilenceAutoStop() {
  clearSilenceTimer();
  silenceTimerId = setTimeout(() => {
    stopRecordingAutomatically();
  }, SILENCE_TIMEOUT_MS);
}

function scheduleMaxRecordingAutoStop() {
  clearMaxRecordingTimer();
  maxRecordingTimerId = setTimeout(() => {
    stopRecordingAutomatically();
  }, MAX_RECORDING_MS);
}

function clearPendingInterimFromPrompt() {
  if (!pendingInterimText) return;
  const current = props.modelValue || '';
  if (current.endsWith(pendingInterimText)) {
    emit('update:modelValue', current.slice(0, -pendingInterimText.length));
  }
  pendingInterimText = '';
}

onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return;
  }

  isSpeechSupported.value = true;
  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    speechError.value = '';
    scheduleMaxRecordingAutoStop();
    scheduleSilenceAutoStop();
  };

  recognition.onresult = (event) => {
    const currentPrompt = props.modelValue || '';
    let finalChunk = '';
    let interimChunk = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        finalChunk += transcript;
      } else {
        interimChunk += transcript;
      }
    }

    const basePrompt = pendingInterimText && currentPrompt.endsWith(pendingInterimText)
      ? currentPrompt.slice(0, -pendingInterimText.length)
      : currentPrompt;
    const nextPrompt = `${basePrompt}${finalChunk}${interimChunk}`;
    pendingInterimText = interimChunk;
    emit('update:modelValue', nextPrompt);
    scheduleSilenceAutoStop();
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
      speechError.value = 'マイクへのアクセスが拒否されています。';
      isRecording.value = false;
      isIntendedStop = true;
      return;
    }

    if (event.error === 'network') {
      speechError.value = '音声認識でネットワークエラーが発生しました。';
      isRecording.value = false;
      isIntendedStop = true;
      return;
    }

    if (event.error === 'no-speech') {
      stopRecordingAutomatically();
      return;
    }

    if (event.error !== 'aborted') {
      speechError.value = `音声認識エラー: ${event.error}`;
    }
  };

  recognition.onend = () => {
    clearSilenceTimer();
    clearMaxRecordingTimer();
    isRecording.value = false;
    clearPendingInterimFromPrompt();
  };
});

onBeforeUnmount(() => {
  isIntendedStop = true;
  clearSilenceTimer();
  clearMaxRecordingTimer();
  clearPendingInterimFromPrompt();
  recognition?.stop?.();
});

function toggleVoiceInput() {
  if (!recognition) return;

  if (isRecording.value) {
    isIntendedStop = true;
    clearSilenceTimer();
    clearMaxRecordingTimer();
    recognition.stop();
    isRecording.value = false;
    clearPendingInterimFromPrompt();
    return;
  }

  isIntendedStop = false;
  isRecording.value = true;
  speechError.value = '';
  try {
    recognition.start();
  } catch {
    isRecording.value = false;
    clearSilenceTimer();
    clearMaxRecordingTimer();
  }
}

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
      <div class="bg-white/90 backdrop-blur-2xl rounded-3xl p-2 shadow-[0_12px_40px_rgba(25,28,29,0.1)] border border-outline-variant/20 flex items-center gap-1">
        <button
          class="w-11 h-11 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors rounded-2xl"
          type="button"
          aria-label="ツールを開く"
          @click="emit('toggle-tool-menu')"
        >
          <span class="material-symbols-outlined">build_circle</span>
        </button>
        <div class="h-7 w-px bg-slate-200/80 mx-1"></div>
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <button
            class="w-11 h-11 flex items-center justify-center transition-colors rounded-2xl hover:bg-slate-100/80"
            :class="isRecording ? 'text-red-600 hover:text-red-700' : 'text-slate-400 hover:text-slate-600'"
            type="button"
            aria-label="音声入力"
            :disabled="!isSpeechSupported"
            @click="toggleVoiceInput"
          >
            <span class="material-symbols-outlined">{{ isRecording ? 'radio_button_checked' : 'mic' }}</span>
          </button>
          <input
            class="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-slate-400 text-sm py-3 px-2"
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
      <p v-if="speechError" class="mt-2 px-2 text-xs text-red-600">{{ speechError }}</p>
      <p v-else-if="isRecording" class="mt-2 px-2 text-xs text-slate-500">無音が約3秒続くか、45秒経過で自動停止します。</p>
      <p v-else-if="!isSpeechSupported" class="mt-2 px-2 text-xs text-slate-500">このブラウザは音声入力に対応していません。</p>
    </div>
  </footer>
</template>
