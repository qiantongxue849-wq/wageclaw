<script setup lang="ts">
/**
 * 统一结算卡：结果 / 本局数据 / 收益 / 成长 / 动作。
 * 在舞台内以覆盖层形式出现，具体定位由父级决定。
 */
defineProps<{
  kind: "win" | "lose" | "draw" | "retreat" | "crash";
  title: string;
  stats?: Array<{ label: string; value: string | number }>;
  rewardLine?: string;
  growthLine?: string;
  primaryText?: string;
  secondaryText?: string;
}>();

const emit = defineEmits<{ primary: []; secondary: [] }>();

const kindLabel: Record<string, string> = {
  win: "胜利",
  lose: "失败",
  draw: "平局",
  retreat: "主动撤退",
  crash: "撞飞了"
};
</script>

<template>
  <div class="result-card" :data-kind="kind">
    <span class="result-kind">{{ kindLabel[kind] ?? kind }}</span>
    <strong class="result-title">{{ title }}</strong>
    <dl v-if="stats?.length" class="result-stats">
      <div v-for="stat in stats" :key="stat.label">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
    <p v-if="rewardLine" class="result-reward">{{ rewardLine }}</p>
    <p v-if="growthLine" class="result-growth">{{ growthLine }}</p>
    <div class="result-actions">
      <button type="button" class="result-primary" @click="emit('primary')">{{ primaryText }}</button>
      <button type="button" class="result-secondary" @click="emit('secondary')">{{ secondaryText }}</button>
    </div>
  </div>
</template>
