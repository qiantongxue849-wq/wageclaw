<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { usePocket } from './usePocket';

interface PackGame {
  title: string;
  genre: string;
  note: string;
  file: string;
}

const games: PackGame[] = [
  { title: '坦克大战', genre: '射击', note: '方向键移动，空格开炮', file: 'games/tank/index.html' },
  { title: '丛林突击', genre: '魂斗罗风', note: '← → 移动，空格跳，Z / J 射击', file: 'games/contra/index.html' },
  { title: '跳跃冒险', genre: '马里奥风', note: '方向键移动，空格跳跃，X 加速', file: 'games/arcade/games/jumpman.html' },
  { title: '炸弹迷宫', genre: '炸弹人风', note: '方向键移动，空格放炸弹', file: 'games/arcade/games/blastman.html' },
  { title: '雷霆战机', genre: '飞行', note: '方向键移动，Z 射击，X 炸弹', file: 'games/arcade/games/powerwing.html' },
  { title: '极速赛车', genre: '竞速', note: '↑ 加速，↓ 刹车，← → 转向', file: 'games/arcade/games/speedway.html' },
  { title: '吃豆迷宫', genre: '追逐', note: '方向键移动，吃光豆子躲开幽灵', file: 'games/arcade/games/pucMan.html' },
  { title: '青蛙过河', genre: '闯关', note: '方向键移动，躲车跳浮木', file: 'games/arcade/games/froggit.html' },
  { title: '西洋跳棋', genre: '对弈', note: '点击走棋，跳吃对方棋子', file: 'games/gb/checkers/index.html' },
  { title: '五子棋', genre: '对弈', note: '点击落子，可与电脑或双人对弈', file: 'games/gomoku/index.html' }
];

const pocket = usePocket();
defineProps<{ theme: 'light' | 'dark' }>();
const emit = defineEmits<{ active: [value: boolean] }>();
const desktop = !!window.wageclawLite;
const windowControls = !!window.wageclawLite?.windowControls;
const open = ref(false);
const current = ref<PackGame | null>(null);
const backButton = ref<HTMLButtonElement>();
let previousFocus: HTMLElement | null = null;
let cleanupFrame: (() => void) | undefined;
const src = computed(() => (current.value ? `${import.meta.env.BASE_URL}${current.value.file}` : ''));
const overlay = computed(() => open.value || !!current.value);
watch(overlay, async value => {
  emit('active', value);
  await nextTick();
  if (value) backButton.value?.focus();
  else previousFocus?.focus();
});

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !overlay.value) return;
  event.preventDefault();
  if (current.value) current.value = null;
  else close();
}
function close() {
  cleanupFrame?.();
  open.value = false;
  current.value = null;
}
function toggle() {
  if (open.value) close();
  else {
    open.value = true;
    previousFocus = document.activeElement as HTMLElement;
  }
}
function pick(game: PackGame) {
  previousFocus = document.activeElement as HTMLElement;
  current.value = game;
}
function back() { cleanupFrame?.(); current.value = null; }
const embedCss = `
  html, body { height: 100% !important; min-height: 0 !important; overflow: hidden !important; }
  body { padding: 0 !important; align-items: center !important; justify-content: center !important; }
  .back-link, .skip-link, .cp-toggle, .cp-panel, .control-hint,
  .game-shell h1 { display: none !important; }
  .game-shell {
    box-sizing: border-box !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    margin: 0 !important;
    padding: 4px !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 4px !important;
    animation: none !important;
  }
  .game-shell > * { margin: 0 !important; }
  .gb-status { font-size: 11px !important; line-height: 1.3 !important; }
  .gb-btn, .gb-btn-solid { padding: 3px 8px !important; font-size: 11px !important; }
  .gb-selector { gap: 4px !important; }
  .embed-controls { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  @media (max-height: 240px) {
    .game-shell { display: grid !important; height: 100% !important; grid-template-columns: minmax(0,1fr) 106px; gap: 6px !important; align-items: center !important; justify-items: center; }
    .embed-controls { grid-column: 2; grid-row: 1; max-height: 100%; overflow: hidden; width: 100%; font-size: 11px; padding: 2px; }
    .embed-controls .gb-selector { flex-wrap: wrap; justify-content: center; }
    .embed-controls .gb-scoreboard { font-size: 10px; }
    .console { padding: 2px !important; gap: 2px !important; border: 0 !important; border-radius: 0 !important; }
    .screen-bezel { padding: 0 !important; }
    .hud-chip, .pchip, .hud::after { font-size: 9px !important; padding: 1px 3px !important; }
    .overlay { padding: 4px !important; gap: 6px !important; }
    .ov-title { font-size: 13px !important; }
    .ov-btn { padding: 5px 14px !important; font-size: 11px !important; }
  }
`;

function fitEmbedded(doc: Document) {
  if (!doc.getElementById('wageclaw-embed')) {
    const style = doc.createElement('style');
    style.id = 'wageclaw-embed';
    style.textContent = embedCss;
    doc.head.appendChild(style);
  }
  const shell = doc.querySelector<HTMLElement>('.game-shell');
  const field = doc.querySelector<HTMLElement>('#board, canvas');
  if (!shell || !field) return;
  if (!shell.querySelector('.embed-controls')) {
    const controls = doc.createElement('div');
    controls.className = 'embed-controls';
    for (const child of [...shell.children]) {
      if (child !== field && child.tagName !== 'H1') controls.appendChild(child);
    }
    shell.appendChild(controls);
  }
  shell.style.zoom = '1';
  field.style.zoom = '1';
  field.style.gridColumn = '1';
  field.style.gridRow = '1';
  if (field.tagName === 'CANVAS') {
    field.style.width = 'auto';
    field.style.height = 'auto';
  }
  const viewW = doc.documentElement.clientWidth;
  const viewH = doc.documentElement.clientHeight;
  const fieldRect = field.getBoundingClientRect();
  if (fieldRect.width > 1 && fieldRect.height > 1) {
    const chrome = viewH <= 240 ? 0 : Math.max(0, shell.scrollHeight - fieldRect.height);
    const width = viewH <= 240 ? viewW - 120 : viewW - 8;
    const scale = Math.max(0.05, Math.min(1, (viewH - chrome - 8) / fieldRect.height, width / fieldRect.width));
    if (scale < 0.98) {
      if (field.tagName === 'CANVAS') {
        field.style.width = `${Math.floor(fieldRect.width * scale)}px`;
        field.style.height = `${Math.floor(fieldRect.height * scale)}px`;
      } else {
        field.style.zoom = String(scale);
      }
    }
  }
  if (viewH > 240) {
    const scale = Math.min(1, (viewH - 4) / shell.scrollHeight, (viewW - 4) / shell.scrollWidth);
    shell.style.zoom = String(Math.max(0.05, scale));
  }
}

function focusGame(event: Event) {
  cleanupFrame?.();
  const iframe = event.currentTarget as HTMLIFrameElement;
  const doc = iframe.contentDocument;
  if (!doc) return;
  let alive = true;
  const fit = () => { if (alive) fitEmbedded(doc); };
  fit();
  void doc.fonts.ready.then(fit);
  const observer = new ResizeObserver(fit);
  observer.observe(iframe);
  const afterClick = () => requestAnimationFrame(fit);
  doc.addEventListener('click', afterClick);
  doc.addEventListener('keydown', onKey, true);
  iframe.contentWindow?.focus();
  cleanupFrame = () => {
    alive = false;
    observer.disconnect();
    doc.removeEventListener('click', afterClick);
    doc.removeEventListener('keydown', onKey, true);
  };
}

watch(current, async game => {
  if (!game) {
    cleanupFrame?.();
    await nextTick();
    if (open.value) backButton.value?.focus();
  }
});
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => { cleanupFrame?.(); window.removeEventListener('keydown', onKey); });
</script>
<template>
  <section v-if="pocket" class="break-corner game-stage" aria-label="小游戏">
    <div class="game-pack">
      <button v-for="game in games" :key="game.file" type="button" @click="pick(game)">
        <strong>{{ game.title }}</strong><small class="game-genre">{{ game.genre }}</small>
        <span>{{ game.note }}</span>
      </button>
    </div>
  </section>
  <section v-else class="break-corner" aria-labelledby="break-title">
    <header>
      <div>
        <h2 id="break-title">想换个脑子？十款小时候的游戏。</h2>
        <p>选一款玩。这一局不记进今天的收入。</p>
      </div>
      <button type="button" :aria-expanded="open" @click="toggle">{{ open ? '收起来 −' : '选一款 ↗' }}</button>
    </header>
  </section>
  <Teleport to="body">
    <div v-if="overlay" class="game-overlay notebook-games" :class="{ 'is-desktop': desktop, 'has-window-controls': windowControls }" :data-theme="theme" role="dialog" aria-modal="true" aria-label="小游戏">
      <header>
        <button ref="backButton" type="button" :aria-label="current ? '返回列表' : '先收起来'" @click="current ? back() : close()">‹ <span>{{ current ? '返回' : '收起' }}</span></button>
        <span class="game-name" :title="current?.note">{{ current?.title ?? '选一款' }}</span>
        <span class="game-key-hint">{{ current?.note }}</span>
      </header>
      <div v-if="!current" class="game-pack">
        <button v-for="game in games" :key="game.file" type="button" @click="pick(game)">
          <strong>{{ game.title }}</strong><small class="game-genre">{{ game.genre }}</small>
          <span>{{ game.note }}</span>
        </button>
      </div>
      <iframe v-else :key="current.file" class="game-frame" :src="src" :title="current.title" @load="focusGame"></iframe>
    </div>
  </Teleport>
</template>
