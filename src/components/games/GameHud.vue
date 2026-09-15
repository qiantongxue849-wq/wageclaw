<script setup lang="ts">
/** 舞台内 HUD：一排状态胶囊（跑酷的得分/最佳，或未来其他游戏的顶内状态） */
defineProps<{
  items: Array<{ label: string; value: string | number; accent?: boolean }>;
}>();
</script>

<template>
  <div class="game-hud">
    <span
      v-for="item in items"
      :key="item.label"
      class="hud-chip"
      :class="{ accent: item.accent }"
    >
      <small>{{ item.label }}</small>
      <b>{{ item.value }}</b>
    </span>
  </div>
</template>
