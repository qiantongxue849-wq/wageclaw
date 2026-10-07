import { onMounted, onUnmounted, ref } from 'vue';

const queryText = '(max-width: 640px) and (max-height: 480px)';

/** 详情窗内容区 287×183：数据、桌宠、游戏分三屏。 */
export function usePocket() {
  const query = window.matchMedia(queryText);
  const pocket = ref(query.matches);
  const sync = () => { pocket.value = query.matches; };
  onMounted(() => {
    sync();
    query.addEventListener('change', sync);
  });
  onUnmounted(() => query.removeEventListener('change', sync));
  return pocket;
}
