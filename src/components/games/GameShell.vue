<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

/**
 * 统一游戏壳层：顶栏（返回 / 标题 / 动作位）+ 退出确认。
 * active 为 true 时退出需要二次确认；Esc 默认等同退出，跑酷传 escAction="none" 自行接管。
 */
const props = defineProps<{
  game: "duel" | "gomoku" | "runner";
  title: string;
  subtitle: string;
  active?: boolean;
  escAction?: "exit" | "none";
}>();

const emit = defineEmits<{ exit: [] }>();

function requestExit() {
  if (props.active && !window.confirm("当前局还没结束，退出会放弃本局进度（跑酷会按已得分结算）。确定退出吗？")) {
    return;
  }
  emit("exit");
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || props.escAction === "none") return;
  event.preventDefault();
  requestExit();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <section class="modal-layer game-modal-layer">
    <div class="game-shell" :data-game="game">
      <header class="game-topbar">
        <div class="game-top-title">
          <button type="button" class="game-back" aria-label="返回游戏厅" @click="requestExit">←</button>
          <div>
            <strong>{{ title }}</strong>
            <small>{{ subtitle }}</small>
          </div>
        </div>
        <div class="game-top-actions">
          <slot name="actions" />
          <button type="button" class="game-exit" @click="requestExit">退出</button>
        </div>
      </header>
      <div class="game-body">
        <slot />
      </div>
    </div>
  </section>
</template>
