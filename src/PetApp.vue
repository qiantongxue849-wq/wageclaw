<script setup lang="ts">
import PetSpriteLight from "@/components/PetSpriteLight.vue";
import { usePetRuntime } from "@/composables/usePetRuntime";

const {
  viewMode,
  state,
  summonedBubble,
  petDialog,
  petReaction,
  petMotionAction,
  petMotionKey,
  petDragging,
  floatingPetStyle,
  currentPetStage,
  petAscension,
  activeWorkEvent,
  startPetDrag,
  handleFloatPetDoubleClick,
  resolveWorkEventChoice
} = usePetRuntime();
</script>

<template>
  <main class="pet-light-root" :data-pet-style="state.petStyle">
    <div v-if="activeWorkEvent" class="pet-work-event" @mousedown.stop @dblclick.stop>
      <span>{{ activeWorkEvent.tone }}</span>
      <strong>{{ activeWorkEvent.title }}</strong>
      <p>{{ activeWorkEvent.prompt }}</p>
      <div class="pet-work-event-actions">
        <button
          v-for="choice in activeWorkEvent.choices"
          :key="choice.id"
          type="button"
          @click="resolveWorkEventChoice(choice.id)"
        >
          <strong>{{ choice.label }}</strong>
          <small>{{ choice.detail }}</small>
          <em>成长 +{{ choice.effect.growth || 0 }}</em>
        </button>
      </div>
    </div>

    <section
      class="floating-pet float-mode"
      :class="[viewMode === 'float' ? 'electron-float' : 'browser-float', petReaction, { dragging: petDragging }]"
      :style="floatingPetStyle"
      aria-label="WageClaw 桌宠"
      @mousedown.left="startPetDrag"
      @dblclick.stop="handleFloatPetDoubleClick"
    >
      <div v-if="summonedBubble" class="pet-bubble">{{ summonedBubble }}</div>
      <div v-if="petDialog" class="pet-dialog" v-html="petDialog"></div>

      <PetSpriteLight
        :stage="currentPetStage"
        :ascension="petAscension"
        mode="compact"
        :action="petMotionAction"
        :motion-key="petMotionKey"
      />
    </section>
  </main>
</template>
