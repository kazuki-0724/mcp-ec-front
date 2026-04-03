<template>
  <header class="fixed top-0 left-0 right-0 md:left-64 z-50 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(25,28,29,0.05)]">
    <div class="flex items-center justify-between px-4 sm:px-6 py-3 w-full max-w-7xl mx-auto">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center ai-orb-glow">
          <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
        </div>
        <div>
          <h1 class="text-sm font-bold tracking-tight text-slate-900 font-headline">Aura Assistant</h1>
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Live Analysis</span>
          </div>
        </div>
      </div>
      <div class="hidden lg:flex items-center gap-4">
        <span class="text-xs font-semibold text-blue-700">Concierge Active</span>
        <span class="text-xs font-medium text-slate-500">MCP Connected</span>
      </div>
    </div>
  </header>
</template>
