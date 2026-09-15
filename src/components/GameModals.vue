<script setup lang="ts">
import type { WageClawStore } from "@/composables/useWageClaw";
import DuelGame from "@/components/games/DuelGame.vue";
import GomokuGame from "@/components/games/GomokuGame.vue";
import RunnerGame from "@/components/games/RunnerGame.vue";

/**
 * 游戏路由：只负责按可见性挂载三款游戏的沉浸壳层，具体呈现各自组件负责。
 */
defineProps<{ wc: WageClawStore }>();
</script>

<template>
  <DuelGame v-if="wc.duel.visible" :wc="wc" @exit="wc.duel.visible = false" />
  <GomokuGame v-if="wc.gomoku.visible" :wc="wc" @exit="wc.stopGomoku()" />
  <RunnerGame v-if="wc.runner.visible" :wc="wc" />
</template>
