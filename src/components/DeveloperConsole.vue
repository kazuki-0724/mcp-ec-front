<script setup>
defineProps({
  loadingTarget: {
    type: Boolean,
    default: false
  },
  loadingRuntimeDiagnostics: {
    type: Boolean,
    default: false
  },
  runningProbe: {
    type: Boolean,
    default: false
  },
  devTarget: {
    type: Object,
    default: null
  },
  devProbeResult: {
    type: String,
    default: ''
  },
  devProbeError: {
    type: String,
    default: ''
  },
  probeKeyword: {
    type: String,
    default: ''
  },
  probeEmployeeId: {
    type: String,
    default: ''
  },
  probeItemId: {
    type: String,
    default: ''
  }
});

defineEmits([
  'refresh-target',
  'run-probe',
  'fetch-runtime-diagnostics',
  'update:probeKeyword',
  'update:probeEmployeeId',
  'update:probeItemId'
]);
</script>

<template>
  <section class="pt-24 pb-28 md:pb-10 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto">
    <section class="bg-white rounded-3xl p-6 shadow-[0_12px_40px_rgba(25,28,29,0.05)] border border-slate-100">
      <div class="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Developer Menu</h2>
          <p class="text-sm text-slate-500">MCPが使う向き先へ直接GraphQLを送信して確認します。</p>
        </div>
        <button class="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold disabled:opacity-60" :disabled="loadingTarget" @click="$emit('refresh-target')">
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
          <button class="text-sm font-bold px-3 py-2 rounded-lg bg-amber-500 text-white disabled:opacity-60" :disabled="loadingRuntimeDiagnostics" @click="$emit('fetch-runtime-diagnostics')">
            {{ loadingRuntimeDiagnostics ? '取得中...' : '子プロセス診断を実行' }}
          </button>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        <div class="rounded-xl border border-slate-200 p-3">
          <p class="text-xs font-bold text-slate-800 mb-2">Recipe Probe</p>
          <input :value="probeKeyword" class="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2" placeholder="keyword" type="text" @input="$emit('update:probeKeyword', $event.target.value)" />
          <button class="w-full text-sm font-bold px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60" :disabled="runningProbe" @click="$emit('run-probe', 'recipe')">
            Run RecipeByKeyword
          </button>
        </div>

        <div class="rounded-xl border border-slate-200 p-3">
          <p class="text-xs font-bold text-slate-800 mb-2">Employee Probe</p>
          <input :value="probeEmployeeId" class="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2" placeholder="employeeId" type="text" @input="$emit('update:probeEmployeeId', $event.target.value)" />
          <button class="w-full text-sm font-bold px-3 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-60" :disabled="runningProbe" @click="$emit('run-probe', 'employee')">
            Run EmployeeById
          </button>
        </div>

        <div class="rounded-xl border border-slate-200 p-3">
          <p class="text-xs font-bold text-slate-800 mb-2">Item Probe</p>
          <input :value="probeItemId" class="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2" placeholder="itemId" type="text" @input="$emit('update:probeItemId', $event.target.value)" />
          <button class="w-full text-sm font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60" :disabled="runningProbe" @click="$emit('run-probe', 'item')">
            Run ItemById
          </button>
        </div>
      </div>

      <p v-if="devProbeError" class="text-sm text-red-600 mt-4">{{ devProbeError }}</p>
      <pre v-if="devProbeResult" class="mt-4 max-h-[420px] overflow-auto text-xs leading-5 p-4 rounded-xl bg-slate-950 text-slate-100">{{ devProbeResult }}</pre>
    </section>
  </section>
</template>