<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ theme: 'light' | 'dark'; compact?: boolean }>();
const desktop = window.wageclawLite;
const enabled = !!desktop?.windowControls;
const maximized = ref(false);
let unsubscribe: (() => void) | undefined;
onMounted(async () => {
  if (!enabled || !desktop) return;
  unsubscribe = desktop.onWindowState(state => { maximized.value = state.maximized; });
  try { maximized.value = (await desktop.getWindowState()).maximized; }
  catch (error) { console.error('Window state:', error); }
});
onBeforeUnmount(() => unsubscribe?.());
async function action(value: 'minimize' | 'toggle-maximize' | 'close') {
  try { await desktop?.windowAction(value); }
  catch (error) { console.error('Window action:', error); }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="enabled" class="window-controls" :class="{ compact }" :data-theme="theme" role="group" aria-label="窗口操作">
      <button type="button" title="最小化" aria-label="最小化窗口" @click="action('minimize')">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 7.5h8" /></svg>
      </button>
      <button type="button" :title="maximized ? '还原' : '最大化'" :aria-label="maximized ? '还原窗口' : '最大化窗口'" @click="action('toggle-maximize')">
        <svg viewBox="0 0 12 12" aria-hidden="true"><template v-if="maximized"><path d="M4 4V2h6v6H8" /><rect x="2" y="4" width="6" height="6" rx=".5" /></template><rect v-else x="2" y="2" width="8" height="8" rx=".7" /></svg>
      </button>
      <button type="button" class="window-close" title="关闭窗口" aria-label="关闭窗口" @click="action('close')">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 2.5 7 7m0-7-7 7" /></svg>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.window-controls { position:fixed; top:4px; right:4px; z-index:40; display:flex; gap:2px; color:#563f2d; -webkit-app-region:no-drag; }
.window-controls.compact { top:2px; }
.window-controls button { display:grid; place-items:center; width:24px; height:24px; min-width:0; margin:0; padding:0; border:0; border-radius:4px; background:transparent; color:inherit; cursor:default; -webkit-app-region:no-drag; }
.window-controls svg { width:11px; height:11px; fill:none; stroke:currentColor; stroke-width:1.1; }
.window-controls button:hover { background:#f7eddd; }
.window-controls button:active { background:#eadfce; }
.window-controls button:focus-visible { outline:1px solid #ac633d; outline-offset:-2px; }
.window-controls[data-theme=dark] { color:#f0e5d5; }
.window-controls[data-theme=dark] button:hover { background:#3b3127; }
.window-controls[data-theme=dark] button:active { background:#504338; }
.window-controls[data-theme=dark] button:focus-visible { outline-color:#e2ac7e; }
.window-controls button.window-close:hover { color:#fff; background:#bc5444; }
</style>
