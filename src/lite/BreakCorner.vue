<script setup lang="ts">
import { computed, ref } from 'vue';
const open = ref(false);
const popped = ref<number[]>([]);
const remaining = computed(() => 9 - popped.value.length);
function pop(index: number) { if (!popped.value.includes(index)) popped.value = [...popped.value, index]; }
</script>
<template>
  <section class="break-corner" aria-labelledby="break-title">
    <header><div><h2 id="break-title">脑袋有点满？来捏几个泡泡。</h2><p>不用得分，也没有输赢。</p></div><button :aria-expanded="open" @click="open = !open">{{ open ? '收起来 −' : '放空一下 ↗' }}</button></header>
    <div v-if="open" class="bubble-game">
      <div class="bubble-grid" aria-label="解压泡泡"><button v-for="n in 9" :key="n" :class="{ popped: popped.includes(n) }" :aria-label="`泡泡 ${n}`" :aria-pressed="popped.includes(n)" @click="pop(n)"><span>{{ popped.includes(n) ? '·' : '' }}</span></button></div>
      <div class="bubble-note"><p role="status">{{ remaining ? '把烦恼轻轻戳掉，给自己一点空隙。' : '这一小片，已经放空了。' }}</p><button @click="popped = []">再来一张</button><small>随时停下也没关系。</small></div>
    </div>
  </section>
</template>
