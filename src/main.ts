import { createApp } from 'vue';
async function start() {
  const view = new URLSearchParams(location.search).get('view');
  const desktop = window.wageclawLite;
  if (view === 'bootstrap' && desktop) {
    const { loadSettings, backupContents } = await import('./lite/storage');
    const loaded = loadSettings(localStorage);
    const archive = JSON.parse(backupContents(localStorage, loaded.key, loaded.settings));
    await desktop.bootstrap({ ...loaded, records: archive.records });
    return;
  }
  if (desktop) window.wageclawInitial = await desktop.getSnapshot();
  if (view === 'hover') {
    const { default: HoverView } = await import('./lite/HoverView.vue');
    createApp(HoverView).mount('#app');
  } else if (view === 'pet' || view === 'bubble' || view === 'pet-preview') {
    const { default: PetView } = await import('./lite/PetView.vue');
    createApp(PetView).mount('#app');
  } else {
    const { default: App } = await import('./App.vue');
    await import('./lite/lite.css');
    createApp(App).mount('#app');
  }
}
void start().catch(error => {
  const root = document.getElementById('app');
  if (root) root.textContent = `暂时无法启动，请重试。${error instanceof Error ? error.message : ''}`;
});
