<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import type { PetStage, PetStyle } from "@/types";

type PetMotionAction = "idle" | "play" | "sleep";
type AssetLoader = () => Promise<string>;

const props = withDefaults(
  defineProps<{
    stage: PetStage;
    mode?: "mini" | "compact" | "hero";
    action?: PetMotionAction;
    motionKey?: number;
  }>(),
  {
    mode: "compact",
    action: "idle",
    motionKey: 0
  }
);

const stageLoaders: Record<string, AssetLoader> = {
  mist: () => import("@/assets/pet-stages/level-01-mist.png?url").then((asset) => asset.default),
  cable: () => import("@/assets/pet-stages/level-02-cable.png?url").then((asset) => asset.default),
  horn: () => import("@/assets/pet-stages/level-03-horn.png?url").then((asset) => asset.default),
  claw: () => import("@/assets/pet-stages/level-04-claw.png?url").then((asset) => asset.default),
  crown: () => import("@/assets/pet-stages/level-05-crown.png?url").then((asset) => asset.default),
  array: () => import("@/assets/pet-stages/level-06-array.png?url").then((asset) => asset.default),
  halo: () => import("@/assets/pet-stages/level-07-halo.png?url").then((asset) => asset.default),
  thunder: () => import("@/assets/pet-stages/level-08-thunder.png?url").then((asset) => asset.default),
  jade: () => import("@/assets/pet-stages/level-09-jade.png?url").then((asset) => asset.default),
  immortal: () => import("@/assets/pet-stages/level-10-immortal.png?url").then((asset) => asset.default)
};

const sheetLoaders: Partial<Record<PetStyle, AssetLoader>> = {
  capybaraZen: () => import("@/assets/pet-sheets/capybara-zen-sheet.png?url").then((asset) => asset.default),
  lazyCat: () => import("@/assets/pet-sheets/lazy-cat-sheet.png?url").then((asset) => asset.default),
  lazyDog: () => import("@/assets/pet-sheets/lazy-dog-sheet.png?url").then((asset) => asset.default),
  honestCow: () => import("@/assets/pet-sheets/honest-cow-sheet.png?url").then((asset) => asset.default)
};

const actionLoaders: Record<PetStyle, Record<Exclude<PetMotionAction, "idle">, AssetLoader>> = {
  rageBlob: {
    play: () => import("@/assets/pet-actions/rageBlob-play.webp?url").then((asset) => asset.default),
    sleep: () => import("@/assets/pet-actions/rageBlob-sleep.webp?url").then((asset) => asset.default)
  },
  capybaraZen: {
    play: () => import("@/assets/pet-actions/capybaraZen-play.webp?url").then((asset) => asset.default),
    sleep: () => import("@/assets/pet-actions/capybaraZen-sleep.webp?url").then((asset) => asset.default)
  },
  lazyCat: {
    play: () => import("@/assets/pet-actions/lazyCat-play.webp?url").then((asset) => asset.default),
    sleep: () => import("@/assets/pet-actions/lazyCat-sleep.webp?url").then((asset) => asset.default)
  },
  lazyDog: {
    play: () => import("@/assets/pet-actions/lazyDog-play.webp?url").then((asset) => asset.default),
    sleep: () => import("@/assets/pet-actions/lazyDog-sleep.webp?url").then((asset) => asset.default)
  },
  honestCow: {
    play: () => import("@/assets/pet-actions/honestCow-play.webp?url").then((asset) => asset.default),
    sleep: () => import("@/assets/pet-actions/honestCow-sleep.webp?url").then((asset) => asset.default)
  }
};

const idleUrl = ref("");
const actionUrl = ref("");
const renderedAction = ref<PetMotionAction>("idle");
const activeStyle = computed<PetStyle>(() => props.stage.style || "rageBlob");
const usesSheet = computed(() => Boolean(sheetLoaders[activeStyle.value]));
let idleLoadToken = 0;
let actionLoadToken = 0;

const spriteClass = computed(() => [
  `stage-${props.stage.level}`,
  `mode-${props.mode}`,
  `pet-style-${activeStyle.value}`,
  `pet-action-${renderedAction.value}`
]);

const styleVars = computed(
  () =>
    ({
      "--pet-body": props.stage.palette.body,
      "--pet-belly": props.stage.palette.belly,
      "--pet-accent": props.stage.palette.accent,
      "--pet-glow": props.stage.palette.glow,
      "--pet-eye": props.stage.palette.eye,
      "--pet-shadow": props.stage.palette.shadow,
      "--pet-idle": idleUrl.value ? `url(${idleUrl.value})` : "none",
      "--pet-position": `${Math.max(0, props.stage.level - 1) * (100 / 9)}%`,
      "--pet-action": actionUrl.value ? `url(${actionUrl.value})` : "none",
      "--pet-action-position": `${Math.max(0, props.stage.level - 1) * (100 / 9)}%`
    }) as CSSProperties
);

watch(
  () => [props.stage.id, activeStyle.value] as const,
  async () => {
    const token = ++idleLoadToken;
    const loader = sheetLoaders[activeStyle.value] || stageLoaders[props.stage.id];
    idleUrl.value = "";
    if (!loader) return;
    try {
      const url = await loader();
      if (token === idleLoadToken) idleUrl.value = url;
    } catch {
      if (token === idleLoadToken) idleUrl.value = "";
    }
  },
  { immediate: true }
);

watch(
  () => [props.action, props.motionKey, props.stage.id, activeStyle.value] as const,
  async () => {
    const token = ++actionLoadToken;
    actionUrl.value = "";
    renderedAction.value = "idle";
    if (props.action === "idle") return;
    const loader = actionLoaders[activeStyle.value]?.[props.action];
    if (!loader) return;
    try {
      const url = await loader();
      if (token === actionLoadToken) {
        actionUrl.value = url;
        renderedAction.value = props.action;
      }
    } catch {
      if (token === actionLoadToken) {
        actionUrl.value = "";
        renderedAction.value = "idle";
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <span class="pet-sprite" :class="spriteClass" :style="styleVars" :aria-label="stage.name" role="img">
    <template v-if="renderedAction !== 'idle' && actionUrl">
      <span
        :key="`${renderedAction}-${activeStyle}-${stage.level}-${motionKey}`"
        class="pet-action-art"
        aria-hidden="true"
      />
    </template>
    <span v-else-if="usesSheet && idleUrl" class="pet-sheet-art" aria-hidden="true" />
    <img v-else-if="idleUrl" class="pet-art" :src="idleUrl" :alt="stage.name" draggable="false" />
    <span v-else class="pet-fallback" aria-hidden="true">
      <span class="pet-eye left" />
      <span class="pet-eye right" />
      <span class="pet-mouth" />
    </span>
  </span>
</template>

<style scoped>
.pet-sprite {
  --pet-size: 128px;
  position: relative;
  display: inline-grid;
  width: var(--pet-size);
  height: var(--pet-size);
  place-items: center;
  isolation: isolate;
  filter: drop-shadow(0 18px 24px color-mix(in srgb, var(--pet-shadow), transparent 52%));
  animation: pet-float 3.6s ease-in-out infinite;
  transform-origin: 50% 72%;
}

.mode-mini {
  --pet-size: 62px;
}

.mode-compact {
  --pet-size: 136px;
}

.mode-hero {
  --pet-size: 196px;
}

.pet-art,
.pet-sheet-art,
.pet-action-art {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  transform-origin: 50% 72%;
}

.pet-art {
  object-fit: contain;
}

.pet-sheet-art {
  background-image: var(--pet-idle);
  background-position: var(--pet-position) center;
  background-repeat: no-repeat;
  background-size: 1000% 100%;
}

.pet-action-art {
  background-image: var(--pet-action);
  background-position: 0 var(--pet-action-position);
  background-repeat: no-repeat;
}

.pet-action-play .pet-action-art {
  background-size: 1200% 1000%;
  animation: pet-action-play 1.3s steps(11, end) both;
}

.pet-action-sleep .pet-action-art {
  background-size: 1800% 1000%;
  animation: pet-action-sleep 2.8s steps(17, end) both;
}

.pet-fallback {
  position: absolute;
  inset: 18% 15% 13%;
  border-radius: 46% 54% 44% 56% / 50% 45% 55% 50%;
  background:
    radial-gradient(circle at 52% 66%, var(--pet-belly) 0 18%, transparent 19%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--pet-body), white 14%),
      var(--pet-body) 54%,
      color-mix(in srgb, var(--pet-shadow), var(--pet-body) 46%)
    );
  box-shadow:
    inset 0 -18px 28px rgba(0, 0, 0, 0.18),
    0 0 26px color-mix(in srgb, var(--pet-glow), transparent 54%);
}

.pet-eye {
  position: absolute;
  top: 37%;
  width: 12%;
  height: 15%;
  border-radius: 999px;
  background: var(--pet-eye);
  box-shadow: 0 0 12px color-mix(in srgb, var(--pet-glow), transparent 35%);
}

.pet-eye.left {
  left: 30%;
}

.pet-eye.right {
  right: 30%;
}

.pet-mouth {
  position: absolute;
  left: 43%;
  top: 55%;
  width: 14%;
  height: 6%;
  border-bottom: 3px solid color-mix(in srgb, var(--pet-eye), transparent 8%);
  border-radius: 0 0 999px 999px;
}

@keyframes pet-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes pet-action-play {
  from {
    background-position-x: 0;
  }

  to {
    background-position-x: 100%;
  }
}

@keyframes pet-action-sleep {
  from {
    background-position-x: 0;
  }

  to {
    background-position-x: 100%;
  }
}
</style>
