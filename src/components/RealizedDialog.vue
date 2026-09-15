<script setup lang="ts">
import type { WageClawStore } from "@/composables/useWageClaw";
import { resolveWishVisual } from "@/data/visuals";

defineProps<{ wc: WageClawStore; open: boolean }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
<section v-if="open" class="modal-layer realized-modal-layer" @click.self="emit('close')">
  <div class="realized-modal">
    <header class="panel-header realized-modal-header">
      <div>
        <span class="eyebrow">已实现心愿</span>
        <h3>成就陈列</h3>
      </div>
      <button type="button" class="icon-button" aria-label="关闭已实现心愿弹窗" @click="emit('close')">×</button>
    </header>
    <div class="realized-gallery realized-modal-list" :class="{ empty: !wc.earnedGoods.length }">
      <template v-if="wc.earnedGoods.length">
        <article v-for="good in wc.earnedGoods" :key="`converter-realized-${good.id}`" class="realized-card realized-modal-card">
          <div class="realized-visual asset-macbook complete" aria-hidden="true">
            <img :src="resolveWishVisual(good.itemId).full" class="macbook-full-render" alt="" draggable="false" />
          </div>
          <div class="realized-card-copy">
            <strong>{{ good.icon }} {{ good.name }}</strong>
            <small>{{ good.source }} · {{ good.time }} · {{ wc.formatMoney(good.amount) }}</small>
            <p>这件礼物已经从心愿系统毕业，删除后会把对应金额退回工资余额。</p>
            <button type="button" class="danger-button realized-delete-button" @click="wc.deleteEarnedGood(good.id)">删除并退款</button>
          </div>
        </article>
      </template>
      <article v-else class="realized-card realized-card-empty">
        <div class="realized-visual asset-macbook complete" aria-hidden="true">
          <img :src="resolveWishVisual(wc.state.activeWishId).full" class="macbook-full-render" alt="" draggable="false" />
        </div>
        <div>
          <strong>还没有实现的心愿</strong>
          <small>完成当前拆分后会自动入库</small>
          <p>这里会陈列已经靠工资进度拿回来的实体礼物，不和桌宠背包混在一起。</p>
        </div>
      </article>
    </div>
  </div>
</section>
</template>
