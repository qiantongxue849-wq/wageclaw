import { onMounted, onUnmounted, watch, type Ref } from 'vue';

/** Measure intrinsic content, so a small existing window can grow again. */
export function usePopupFit(target: Ref<HTMLElement | undefined>, enabled = true) {
  let observer: ResizeObserver | undefined;
  let frame = 0, lastSize = '', disposed = false;
  const measure = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = target.value?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height || disposed) return;
      const size = { width: Math.ceil(rect.width) + 8, height: Math.ceil(rect.height) + 8 };
      const key = `${size.width}:${size.height}`;
      if (key === lastSize) return;
      lastSize = key;
      void window.wageclawLite?.fitPopup?.(size).catch(() => { lastSize = ''; });
    });
  };
  let unwatch: (() => void) | undefined;
  onMounted(() => {
    if (!enabled || !window.wageclawLite?.fitPopup) return;
    observer = new ResizeObserver(measure);
    unwatch = watch(target, element => {
      observer?.disconnect();
      if (element) { observer?.observe(element); measure(); }
    }, { immediate: true, flush: 'post' });
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
  });
  onUnmounted(() => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); unwatch?.(); });
}
