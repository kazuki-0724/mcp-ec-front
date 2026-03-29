<script setup>
import { nextTick, onMounted, ref } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import ChatInputBar from './components/ChatInputBar.vue';
import { postChat } from './services/chatApi.js';

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
const messages = ref([
  {
    id: 0,
    role: 'ai',
    text: 'こんにちは。社員情報やレシピ材料の取得に対応しています。例: カレーの材料をカゴに追加して。',
    loading: false
  }
]);

let messageSeq = 1;

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

  createMessage('user', trimmedPrompt);
  prompt.value = '';

  const loadingMessageId = createMessage('ai', '考え中...', true);
  sending.value = true;

  await nextTick();
  const lastMessage = document.querySelector('.message-row:last-child');
  lastMessage?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  try {
    const data = await postChat(trimmedPrompt);
    updateMessage(loadingMessageId, {
      text: data.text || data.error || '回答を取得できませんでした。'
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
});
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

    <div class="md:ml-64">
      <AppHeader />

      <template v-if="activeMenu === 'chat'">
        <ChatMessageList :messages="messages" />
        <ChatInputBar v-model="prompt" :sending="sending" @send="sendPrompt" />
      </template>

      <main v-else class="pt-24 pb-10 px-4 max-w-4xl mx-auto">
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
      </main>
    </div>
  </div>
</template>
