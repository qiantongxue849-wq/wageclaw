<script setup lang="ts">
import PetSpriteLight from "@/components/PetSpriteLight.vue";
import { usePetRuntime } from "@/composables/usePetRuntime";

const {
  viewMode,
  state,
  summonedBubble,
  petDialog,
  petReaction,
  petModePicker,
  petMotionAction,
  petMotionKey,
  petDragging,
  floatingPetStyle,
  currentPetStage,
  petAscension,
  startPetDrag,
  handleFloatPetDoubleClick,
  selectPetInteractionMode
} = usePetRuntime();
</script>

<template>
  <main class="pet-light-root" :data-pet-style="state.petStyle">
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

      <div v-if="petModePicker" class="pet-mode-picker" @mousedown.stop>
        <strong>互动模式</strong>
        <div class="pet-mode-actions">
          <button type="button" @click="selectPetInteractionMode('normal')">陪伴</button>
          <button type="button" @click="selectPetInteractionMode('rage')">收集怨气</button>
        </div>
      </div>

      <span v-if="petReaction === 'hammer'" class="pet-hammer" aria-hidden="true">
        <span class="pet-hammer-head"></span>
        <span class="pet-hammer-handle"></span>
      </span>

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
