<script setup lang="ts">
import { computed } from "vue";
import type { CSSProperties } from "vue";
import stage01 from "@/assets/pet-stages/level-01-mist.png";
import stage02 from "@/assets/pet-stages/level-02-cable.png";
import stage03 from "@/assets/pet-stages/level-03-horn.png";
import stage04 from "@/assets/pet-stages/level-04-claw.png";
import stage05 from "@/assets/pet-stages/level-05-crown.png";
import stage06 from "@/assets/pet-stages/level-06-array.png";
import stage07 from "@/assets/pet-stages/level-07-halo.png";
import stage08 from "@/assets/pet-stages/level-08-thunder.png";
import stage09 from "@/assets/pet-stages/level-09-jade.png";
import stage10 from "@/assets/pet-stages/level-10-immortal.png";
import type { PetStage } from "@/types";

const props = withDefaults(
  defineProps<{
    stage: PetStage;
    mode?: "mini" | "compact" | "hero";
  }>(),
  {
    mode: "compact"
  }
);

const petArt: Record<string, string> = {
  mist: stage01,
  cable: stage02,
  horn: stage03,
  claw: stage04,
  crown: stage05,
  array: stage06,
  halo: stage07,
  thunder: stage08,
  jade: stage09,
  immortal: stage10
};

const spriteClass = computed(() => [`stage-${props.stage.level}`, `mode-${props.mode}`]);
const artUrl = computed(() => petArt[props.stage.id]);
const styleVars = computed(
  () =>
    ({
      "--pet-body": props.stage.palette.body,
      "--pet-belly": props.stage.palette.belly,
      "--pet-accent": props.stage.palette.accent,
      "--pet-glow": props.stage.palette.glow,
      "--pet-eye": props.stage.palette.eye,
      "--pet-shadow": props.stage.palette.shadow
    }) as CSSProperties
);
</script>

<template>
  <span class="pet-sprite" :class="spriteClass" :style="styleVars" :aria-label="`${stage.name}：${stage.visual}`" role="img">
    <img v-if="artUrl" class="pet-art" :src="artUrl" :alt="stage.name" draggable="false" />
    <template v-else>
      <span class="pet-orbit pet-orbit-a"></span>
      <span class="pet-orbit pet-orbit-b"></span>
      <span class="pet-tail"></span>
      <span class="pet-horn pet-horn-left"></span>
      <span class="pet-horn pet-horn-right"></span>
      <span class="pet-crown"></span>
      <span class="pet-body">
        <span class="pet-core"></span>
        <span class="pet-eye pet-eye-left"></span>
        <span class="pet-eye pet-eye-right"></span>
        <span class="pet-mouth"></span>
        <span class="pet-sigil">{{ stage.sigil }}</span>
      </span>
      <span class="pet-claw pet-claw-left"></span>
      <span class="pet-claw pet-claw-right"></span>
      <span class="pet-shard pet-shard-a"></span>
      <span class="pet-shard pet-shard-b"></span>
      <span class="pet-shard pet-shard-c"></span>
    </template>
  </span>
</template>

<style scoped>
.pet-sprite {
  --pet-size: 118px;
  position: relative;
  display: inline-grid;
  width: var(--pet-size);
  height: var(--pet-size);
  place-items: center;
  isolation: isolate;
  filter: drop-shadow(0 18px 24px color-mix(in srgb, var(--pet-shadow), transparent 52%));
  animation: pet-float 3.6s ease-in-out infinite;
}

.pet-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  transform-origin: 50% 72%;
}

.mode-mini {
  --pet-size: 60px;
}

.mode-compact {
  --pet-size: 128px;
}

.mode-hero {
  --pet-size: 196px;
}

.pet-body {
  position: absolute;
  inset: 18% 15% 13%;
  z-index: 2;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--pet-glow), white 15%);
  border-radius: 46% 54% 44% 56% / 50% 45% 55% 50%;
  background:
    radial-gradient(circle at 52% 66%, var(--pet-belly) 0 18%, transparent 19%),
    radial-gradient(circle at 34% 23%, rgba(255, 255, 255, 0.34) 0 8%, transparent 9%),
    linear-gradient(145deg, color-mix(in srgb, var(--pet-body), white 14%), var(--pet-body) 54%, color-mix(in srgb, var(--pet-shadow), var(--pet-body) 46%));
  box-shadow:
    inset 0 8px 12px rgba(255, 255, 255, 0.15),
    inset 0 -14px 24px color-mix(in srgb, var(--pet-shadow), transparent 46%),
    0 0 32px color-mix(in srgb, var(--pet-glow), transparent 58%);
}

.pet-core {
  position: absolute;
  left: 50%;
  bottom: 16%;
  width: 28%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #fff7c8 0 22%, var(--pet-belly) 34% 62%, transparent 68%);
  transform: translateX(-50%);
  opacity: 0.92;
  animation: pet-core-pulse 1.8s ease-in-out infinite;
}

.pet-eye {
  position: absolute;
  top: 36%;
  width: 13%;
  height: 18%;
  border-radius: 50%;
  background: var(--pet-eye);
  box-shadow: 0 0 14px color-mix(in srgb, var(--pet-eye), transparent 30%);
}

.pet-eye::after {
  content: "";
  position: absolute;
  inset: 26% 22% 18% 36%;
  border-radius: 50%;
  background: var(--pet-shadow);
}

.pet-eye-left {
  left: 31%;
}

.pet-eye-right {
  right: 31%;
}

.pet-mouth {
  position: absolute;
  left: 50%;
  top: 57%;
  width: 18%;
  height: 8%;
  border-bottom: 2px solid color-mix(in srgb, var(--pet-shadow), white 10%);
  border-radius: 0 0 99px 99px;
  transform: translateX(-50%);
  opacity: 0.72;
}

.pet-sigil {
  position: absolute;
  left: 50%;
  bottom: 13%;
  display: grid;
  width: 26%;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  color: color-mix(in srgb, var(--pet-shadow), black 20%);
  background: color-mix(in srgb, var(--pet-belly), white 22%);
  font-size: calc(var(--pet-size) * 0.09);
  font-weight: 900;
  line-height: 1;
  transform: translateX(-50%);
}

.pet-tail,
.pet-horn,
.pet-crown,
.pet-claw,
.pet-shard,
.pet-orbit {
  position: absolute;
  display: block;
}

.pet-tail {
  right: 4%;
  bottom: 24%;
  z-index: 1;
  width: 36%;
  height: 12%;
  border: 3px solid var(--pet-accent);
  border-left: 0;
  border-bottom: 0;
  border-radius: 0 999px 0 0;
  transform: rotate(28deg);
  transform-origin: left center;
  opacity: 0.72;
}

.pet-horn {
  top: 13%;
  z-index: 3;
  width: 15%;
  height: 24%;
  border-radius: 80% 80% 20% 20%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--pet-accent), white 18%), var(--pet-accent));
  transform-origin: bottom center;
  opacity: 0;
}

.pet-horn-left {
  left: 29%;
  transform: rotate(-24deg);
}

.pet-horn-right {
  right: 29%;
  transform: rotate(24deg);
}

.pet-crown {
  top: 4%;
  left: 50%;
  z-index: 4;
  width: 38%;
  height: 18%;
  clip-path: polygon(0 100%, 12% 32%, 30% 78%, 50% 0, 70% 78%, 88% 32%, 100% 100%);
  background: linear-gradient(180deg, #ffe8a3, var(--pet-belly));
  transform: translateX(-50%);
  opacity: 0;
}

.pet-claw {
  bottom: 18%;
  z-index: 3;
  width: 13%;
  height: 10%;
  border-radius: 999px 999px 40% 40%;
  background: var(--pet-accent);
  opacity: 0;
}

.pet-claw-left {
  left: 14%;
  transform: rotate(18deg);
}

.pet-claw-right {
  right: 14%;
  transform: rotate(-18deg);
}

.pet-shard {
  z-index: 1;
  width: 10%;
  aspect-ratio: 0.7;
  border-radius: 30% 30% 70% 70%;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.86), var(--pet-glow));
  box-shadow: 0 0 16px color-mix(in srgb, var(--pet-glow), transparent 42%);
  opacity: 0;
}

.pet-shard-a {
  left: 5%;
  top: 38%;
  transform: rotate(-18deg);
}

.pet-shard-b {
  right: 4%;
  top: 31%;
  transform: rotate(22deg);
}

.pet-shard-c {
  left: 48%;
  top: 3%;
  transform: rotate(6deg);
}

.pet-orbit {
  inset: 8%;
  z-index: 0;
  border: 1px solid color-mix(in srgb, var(--pet-glow), transparent 34%);
  border-radius: 50%;
  opacity: 0;
  transform: rotate(-18deg);
}

.pet-orbit-b {
  inset: 2% 12%;
  border-color: color-mix(in srgb, var(--pet-accent), transparent 40%);
  transform: rotate(32deg);
}

.stage-1 .pet-eye-left,
.stage-1 .pet-eye-right {
  left: 43%;
  right: auto;
  width: 17%;
}

.stage-1 .pet-eye-right,
.stage-1 .pet-mouth,
.stage-1 .pet-sigil {
  display: none;
}

.stage-2 .pet-tail {
  opacity: 1;
}

.stage-3 .pet-horn,
.stage-4 .pet-horn,
.stage-5 .pet-horn,
.stage-6 .pet-horn,
.stage-7 .pet-horn,
.stage-8 .pet-horn,
.stage-9 .pet-horn,
.stage-10 .pet-horn {
  opacity: 1;
}

.stage-4 .pet-claw,
.stage-5 .pet-claw,
.stage-6 .pet-claw,
.stage-7 .pet-claw,
.stage-8 .pet-claw,
.stage-9 .pet-claw,
.stage-10 .pet-claw {
  opacity: 1;
}

.stage-5 .pet-crown,
.stage-6 .pet-crown,
.stage-7 .pet-crown,
.stage-8 .pet-crown,
.stage-9 .pet-crown,
.stage-10 .pet-crown {
  opacity: 1;
}

.stage-6 .pet-shard,
.stage-7 .pet-shard,
.stage-8 .pet-shard,
.stage-9 .pet-shard,
.stage-10 .pet-shard,
.stage-7 .pet-orbit,
.stage-8 .pet-orbit,
.stage-9 .pet-orbit,
.stage-10 .pet-orbit {
  opacity: 1;
}

.stage-8 .pet-horn {
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.stage-9 .pet-body,
.stage-10 .pet-body {
  border-radius: 48% 52% 34% 66% / 42% 44% 62% 58%;
}

.stage-10 .pet-orbit-a {
  animation: pet-orbit-spin 7s linear infinite;
}

.stage-10 .pet-orbit-b {
  animation: pet-orbit-spin 9s linear infinite reverse;
}

@keyframes pet-float {
  0%,
  100% {
    transform: translateY(0) rotate(-1deg);
  }
  50% {
    transform: translateY(-5%) rotate(1deg);
  }
}

@keyframes pet-core-pulse {
  50% {
    transform: translateX(-50%) scale(1.18);
    filter: brightness(1.18);
  }
}

@keyframes pet-orbit-spin {
  to {
    transform: rotate(342deg);
  }
}
</style>
