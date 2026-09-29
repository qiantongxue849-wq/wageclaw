<script setup lang="ts">
import { ref } from 'vue';
import { usePetMotion } from './petMotion';
import type { PetStyle } from './model';
const props = defineProps<{ style: PetStyle; stage: number; animated?: boolean; transitions?: boolean }>();
const canvas = ref<HTMLCanvasElement>();
const failed = ref(false);
const motion = usePetMotion(canvas, {
  style: () => props.style, stage: () => props.stage,
  enabled: () => Boolean(props.animated), transitions: () => Boolean(props.transitions),
  failed: value => { failed.value = value; }
});
defineExpose({ play: motion.play });
</script>
<template><canvas ref="canvas" class="pet-artwork" width="288" height="288" aria-hidden="true"></canvas><span v-if="failed" class="field-help">形象暂未加载，请切换重试。</span></template>
<style scoped>.pet-artwork { display:block;width:100%;height:100%;object-fit:contain;transform-origin:50% 90%; }</style>
