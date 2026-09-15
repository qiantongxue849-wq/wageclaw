<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import GameShell from "@/components/games/GameShell.vue";
import GameResultCard from "@/components/games/GameResultCard.vue";
import GameHud from "@/components/games/GameHud.vue";
import PetSprite from "@/components/PetSprite.vue";
import type { WageClawStore } from "@/composables/useWageClaw";

/**
 * 怨气闯关 V2：HUD 进舞台、判定带提示、大操作键、失焦暂停 + 倒数恢复、新手教学、摸鱼连段。
 */
const props = defineProps<{ wc: WageClawStore }>();
const emit = defineEmits<{ exit: [] }>();

const countdown = ref(0);
const dangerHintRuns = ref(0);
let countdownTimer: number | undefined;

const isActive = computed(() => props.wc.runner.active && !props.wc.runner.paused);
const showDangerZone = computed(() => dangerHintRuns.value < 3);
const settleKind = computed(() => (props.wc.runner.crash ? "crash" : "retreat") as "crash" | "retreat");
const isSettled = computed(() => Boolean(props.wc.runner.result));

const hudItems = computed(() => [
  { label: "本局得分", value: props.wc.runner.score },
  { label: "速度", value: `${props.wc.runner.speed.toFixed(1)}x`, accent: props.wc.runner.speed > 1 },
  { label: "历史最佳", value: props.wc.runner.best }
]);

const tutorialHint = computed(() => {
  if (!props.wc.runner.tutorial.active) return "";
  return props.wc.runner.tutorial.step === 0
    ? "新手教学 1/2：地面障碍来了，按 跳跃 跳过去！"
    : "新手教学 2/2：空中怨念来了，按 下蹲 滑过去！";
});

function doJump() {
  props.wc.runnerAction("jump");
}

function doDuck() {
  props.wc.runnerAction("duck");
}

function pauseGame() {
  props.wc.pauseRunner();
}

function beginResumeCountdown() {
  if (countdownTimer) window.clearInterval(countdownTimer);
  countdown.value = 3;
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      window.clearInterval(countdownTimer);
      countdownTimer = undefined;
      props.wc.resumeRunner();
    }
  }, 700);
}

function togglePause() {
  if (props.wc.runner.paused) {
    beginResumeCountdown();
  } else {
    pauseGame();
  }
}

function onWindowBlur() {
  if (props.wc.runner.visible && props.wc.runner.active && !props.wc.runner.result) {
    props.wc.pauseRunner();
  }
}

function onWindowFocus() {
  if (props.wc.runner.visible && props.wc.runner.paused && !countdownTimer) {
    beginResumeCountdown();
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  if (props.wc.runner.paused) {
    beginResumeCountdown();
  } else if (props.wc.runner.active) {
    pauseGame();
  }
}

onMounted(() => {
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("focus", onWindowFocus);
  window.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
  window.removeEventListener("blur", onWindowBlur);
  window.removeEventListener("focus", onWindowFocus);
  window.removeEventListener("keydown", onKeydown);
  if (countdownTimer) window.clearInterval(countdownTimer);
});

function onPrimary() {
  props.wc.startRunner();
}

function onSecondary() {
  emit("exit");
}

function onExit() {
  // 活跃局退出：先按已得分结算并关闭（GameShell 已做过二次确认）
  if (props.wc.runner.active) props.wc.stopRunner();
  emit("exit");
}
</script>

<template>
  <GameShell
    game="runner"
    title="怨气闯关"
    subtitle="反应跑酷 · 跳过地面，蹲过空中"
    :active="isActive"
    esc-action="none"
    @exit="onExit"
  >
    <template #actions>
      <span v-if="wc.runner.streak >= 3" class="game-chip streak">摸鱼连段 x{{ wc.runner.streak }}</span>
    </template>

    <div class="game-body runner-layout">
      <section class="run-stage" :class="[wc.runner.pose, { crash: wc.runner.crash, paused: wc.runner.paused }]">
        <div class="run-skyline" aria-hidden="true"></div>
        <div class="run-clouds" aria-hidden="true"></div>
        <GameHud class="run-hud" :items="hudItems" />
        <div v-if="showDangerZone" class="danger-zone" aria-hidden="true"><span>判定区</span></div>
        <div class="track-lines" aria-hidden="true"></div>
        <div class="run-pet">
          <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" mode="mini" />
        </div>
        <div
          v-for="obstacle in wc.runner.obstacles"
          :key="obstacle.id"
          class="obstacle"
          :class="obstacle.high ? 'air' : 'ground'"
          :style="{ left: `${(obstacle.x * 100).toFixed(1)}%` }"
        >
          <b>{{ obstacle.icon }}</b>
          <small>{{ obstacle.kind }}</small>
          <i class="action-arrow" aria-hidden="true">{{ obstacle.high ? "↓ 蹲过" : "↑ 跳过" }}</i>
        </div>
        <span v-if="wc.runner.streak >= 3" class="run-streak">摸鱼连段 x{{ wc.runner.streak }}</span>
        <span v-if="tutorialHint" class="run-tutorial">{{ tutorialHint }}</span>

        <div v-if="wc.runner.paused" class="pause-layer">
          <strong>{{ countdown > 0 ? countdown : "已暂停" }}</strong>
          <p>窗口失焦会自动暂停，回来就能继续。</p>
          <button type="button" class="result-primary" @click="beginResumeCountdown">
            {{ countdown > 0 ? "马上继续" : "继续摸鱼" }}
          </button>
        </div>

        <GameResultCard
          v-if="isSettled"
          class="stage-overlay"
          :kind="settleKind"
          :title="wc.runner.crash ? '被撞飞了！' : '见好就收'"
          :stats="[
            { label: '本局得分', value: wc.runner.score },
            { label: '历史最佳', value: wc.runner.best },
            { label: '摸鱼连段', value: `x${wc.runner.streak}` }
          ]"
          :reward-line="wc.runner.result"
          @primary="onPrimary"
          @secondary="onSecondary"
        />
      </section>

      <section class="runner-controls">
        <button type="button" class="run-jump" @click="doJump">
          <i class="tiny-kbd" aria-hidden="true">Space / ↑</i>跳跃
        </button>
        <button type="button" class="run-duck" @click="doDuck">
          <i class="tiny-kbd" aria-hidden="true">S / ↓</i>下蹲
        </button>
        <button type="button" class="run-pause" @click="togglePause">
          <i class="tiny-kbd" aria-hidden="true">Esc</i>{{ wc.runner.paused ? "继续" : "Ⅱ 暂停" }}
        </button>
      </section>
    </div>
  </GameShell>
</template>
