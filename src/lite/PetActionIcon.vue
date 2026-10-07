<script setup lang="ts">
defineProps<{ kind: 'pat' | 'stretch' | 'wardrobe' }>();
</script>

<template>
  <span class="pet-action-icon" :class="`is-${kind}`" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="kind === 'pat'">
        <path d="M8 13V7a1.5 1.5 0 0 1 3 0v5-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-3a1.5 1.5 0 0 1 3 0v5c0 4-2.5 7-6.5 7-2.5 0-4-1-5.5-3l-4-5a1.5 1.5 0 0 1 2-2l2 2" />
        <path d="m3 4 .5 1M5 2l1 1" />
      </template>
      <template v-else-if="kind === 'stretch'">
        <path d="M5 13C5 6 11 4 20 4c0 8-2 14-8 14-4 0-7-2-7-5Z" />
        <path d="M3 21 15 9M8 16h5M3 8h2M2 11h2" />
      </template>
      <template v-else>
        <path d="M10 6a2 2 0 1 1 3 1.7L12 9v2" />
        <path d="m12 11-9 6a1.5 1.5 0 0 0 .8 2.8h16.4A1.5 1.5 0 0 0 21 17l-9-6Z" />
        <path d="m5 16 2 2m12-2-2 2" />
      </template>
    </svg>
  </span>
</template>

<style>
.pet-action-icon { display:inline-grid; place-items:center; width:20px; height:20px; flex-shrink:0; border-radius:50%; color:#aa673e; background:#f0dfcd; }
.pet-action-icon svg { display:block; width:15px; height:15px; }
.pet-action-icon.is-stretch { color:#6e8056; background:#e8ecdf; }
.pet-action-icon.is-wardrobe { color:#9b7384; background:#efe3e9; }
.lite-root[data-theme=dark] .pet-action-icon { color:#e2b38e; background:#594331; }
.lite-root[data-theme=dark] .pet-action-icon.is-stretch { color:#bdd09f; background:#3e4932; }
.lite-root[data-theme=dark] .pet-action-icon.is-wardrobe { color:#dbb2c5; background:#503b46; }
</style>
