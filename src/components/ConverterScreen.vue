<script setup lang="ts">
import { computed, reactive } from "vue";
import { useHomePetSupply } from "@/composables/useHomePetSupply";
import PetSprite from "@/components/PetSprite.vue";
import {
  bpPillArt,
  explodedSlots,
  feedArt,
  miniSlots,
  resolveSupplyVisual,
  resolveWishVisual,
  sedativeArt
} from "@/data/visuals";
import { profileAvatarCopy } from "@/data/profile-avatars";
import type { WageClawStore } from "@/composables/useWageClaw";

const props = defineProps<{ wc: WageClawStore }>();
const emit = defineEmits<{ openLedger: []; openRealized: [] }>();

const supply = useHomePetSupply(props.wc);
const homePetSupplyPicker = supply.homePetSupplyPicker;
const homePetSupplyEntries = supply.homePetSupplyEntries;
const homePetSupplyTitle = supply.homePetSupplyTitle;
const homePetSupplyEmptyText = supply.homePetSupplyEmptyText;
const toggleHomePetSupplyPicker = supply.toggleHomePetSupplyPicker;
const playWithHomePet = supply.playWithHomePet;
const napWithHomePet = supply.napWithHomePet;
const openHomePetSupplyShop = supply.openHomePetSupplyShop;
const useHomePetSupplyItem = supply.useHomePetSupplyItem;

const monthlyProgressPercent = computed(() => Math.min(100, Math.round(props.wc.salaryCycleProgress.percent * 100)));
const profileAvatar = computed(() => profileAvatarCopy[props.wc.state.theme]);
const activeWishVisual = computed(() => resolveWishVisual(props.wc.state.activeWishId));

const petMotionAction = computed(() => (props.wc.petReaction === "play" || props.wc.petReaction === "sleep" ? props.wc.petReaction : "idle"));
const petStatusBadges = computed(() => {
  const calm = props.wc.state.pet.bloodPressure < 130 ? "血压稳定" : "需要降压";
  const mood = props.wc.state.pet.affection >= 60 ? "无忧无虑" : props.wc.state.pet.touchMood;
  return [props.wc.petAscension.active ? props.wc.petAscension.label : calm, props.wc.petAffinity.label, mood];
});
const petAttributeRows = computed(() => props.wc.petAttributes);

const wishTooltip = reactive({
  partId: "",
  x: 0,
  y: 0,
  placement: "bottom" as "top" | "bottom"
});

const wishParts = computed(() =>
  props.wc.parts.map((part, index) => ({
    ...part,
    image: activeWishVisual.value.parts[part.id] || activeWishVisual.value.full,
    artStyle: explodedSlots[index % explodedSlots.length],
    miniStyle: miniSlots[index % miniSlots.length],
    price: props.wc.getPartPrice(part.id),
    unlocked: props.wc.state.unlockedParts.includes(part.id)
  }))
);
const activeWishTooltipPart = computed(() => wishParts.value.find((part) => part.id === wishTooltip.partId));

function showWishPartTooltip(partId: string, event: MouseEvent | FocusEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const margin = 14;
  const gap = 10;
  const estimatedWidth = Math.min(236, Math.max(160, window.innerWidth - margin * 2));
  const estimatedHeight = 112;
  const halfWidth = estimatedWidth / 2;
  const centerX = rect.left + rect.width / 2;
  const hasRoomBelow = rect.bottom + gap + estimatedHeight <= window.innerHeight - margin;
  const hasRoomAbove = rect.top - gap - estimatedHeight >= margin;
  const placement = hasRoomBelow || !hasRoomAbove ? "bottom" : "top";

  wishTooltip.partId = partId;
  wishTooltip.x = Math.min(window.innerWidth - margin - halfWidth, Math.max(margin + halfWidth, centerX));
  wishTooltip.y =
    placement === "bottom"
      ? Math.min(window.innerHeight - margin - estimatedHeight, Math.max(margin, rect.bottom + gap))
      : Math.max(margin + estimatedHeight, Math.min(window.innerHeight - margin, rect.top - gap));
  wishTooltip.placement = placement;
}

function hideWishPartTooltip(partId: string) {
  if (wishTooltip.partId === partId) {
    wishTooltip.partId = "";
  }
}

function wishTooltipStyle(partId: string) {
  return wishTooltip.partId === partId ? { left: `${wishTooltip.x}px`, top: `${wishTooltip.y}px` } : undefined;
}

function wishTooltipClass(partId: string) {
  const visible = wishTooltip.partId === partId;
  return {
    visible,
    "place-top": visible && wishTooltip.placement === "top",
    "place-bottom": visible && wishTooltip.placement === "bottom"
  };
}

function getSupplyVisual(itemId: string) {
  return resolveSupplyVisual(itemId);
}
</script>

<template>
<section v-show="wc.activeScreen === 'converter'" class="screen-grid">
  <section class="home-hero-grid">
    <article class="salary-overview-card">
      <header class="salary-overview-balance">
        <div class="salary-overview-worker-art" aria-hidden="true">
          <img :src="profileAvatar.image" alt="" draggable="false" />
        </div>
        <div class="salary-overview-title">
          <span class="salary-overview-label">
            <i class="overview-icon calendar-icon" aria-hidden="true"></i>
            工资余额
          </span>
          <h2>{{ wc.formatBalance(wc.walletCoins, 2) }}</h2>
        </div>
        <div class="salary-overview-chip">
          <i class="overview-icon coin-icon" aria-hidden="true"></i>
          <div>
            <span>爪币余额</span>
            <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
          </div>
        </div>
      </header>

      <section class="salary-overview-progress" aria-label="本轮发工资进度">
        <header>
          <div>
            <span>
              <i class="overview-icon calendar-icon" aria-hidden="true"></i>
              本轮发工资进度
              <em>?</em>
            </span>
            <small>{{ wc.salaryCycleProgress.startLabel }} - {{ wc.salaryCycleProgress.endLabel }}</small>
          </div>
          <strong>{{ monthlyProgressPercent }}<small>%</small></strong>
        </header>
        <div class="salary-overview-meter">
          <i><b :style="{ width: `${monthlyProgressPercent}%` }"></b></i>
          <div class="salary-overview-scale">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <p>{{ wc.formatMoney(wc.salaryCycleProgress.accumulated, 2) }} / {{ wc.formatMoney(wc.state.salary, 2) }}</p>
      </section>

      <footer class="salary-overview-stats">
        <div class="salary-overview-stat">
          <i class="overview-icon calendar-icon" aria-hidden="true"></i>
          <div>
            <span>今日已领</span>
            <strong>{{ wc.formatBalance(wc.todayClaimedSalary) }}</strong>
          </div>
        </div>
        <div class="salary-overview-stat">
          <i class="overview-icon coin-icon" aria-hidden="true"></i>
          <div>
            <span>今日爪币</span>
            <strong>{{ wc.formatPawCoins(wc.pawTodayEarned) }}</strong>
          </div>
        </div>
        <button type="button" class="salary-overview-claim" @click="wc.claimDailyWallet">
          <i class="gift-icon" aria-hidden="true"><b></b><em></em></i>
          领取
        </button>
      </footer>
    </article>
    <article class="home-pet-status-card" :style="wc.petStageStyle()" aria-label="桌宠属性">
      <header class="home-pet-status-head">
        <div>
          <span>桌宠属性</span>
          <h2>
            {{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}
            <small v-if="wc.petAscension.active">{{ wc.petAscension.label }}</small>
          </h2>
        </div>
        <button type="button" class="home-pet-summon-chip" @click="wc.setPetSummoned()">
          {{ wc.state.pet.summoned ? "已在桌面" : "召唤" }}
        </button>
      </header>

      <div class="home-pet-status-body">
        <section class="home-pet-portrait" :class="wc.petReaction" aria-label="当前桌宠形象">
          <div class="home-pet-portrait-glow" aria-hidden="true"></div>
          <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" mode="hero" :action="petMotionAction" :motion-key="wc.petMotionKey" />
          <small>{{ wc.petAscension.active ? wc.petAscension.title : wc.currentPetStage.title }}</small>
          <div class="home-pet-status-orbit" aria-label="桌宠状态">
            <span v-for="badge in petStatusBadges" :key="`home-pet-badge-${badge}`">{{ badge }}</span>
          </div>
        </section>

        <section class="home-pet-attrs" aria-label="基础属性">
          <div
            v-for="row in petAttributeRows"
            :key="`home-pet-${row.label}`"
            class="pet-attribute-row"
            :style="{ '--attribute-color': row.color }"
          >
            <span class="pet-attribute-icon">{{ row.icon }}</span>
            <strong>{{ row.label }}</strong>
            <i><b :style="{ width: `${row.percent}%` }"></b></i>
            <em>{{ row.unit ? `${row.value}${row.unit}` : `${row.value}/${row.max}` }}</em>
          </div>
        </section>
      </div>

      <footer class="home-pet-card-footer">
        <div class="home-pet-actions" aria-label="桌宠互动">
          <button
            type="button"
            :class="{ active: homePetSupplyPicker === 'food' }"
            @click="toggleHomePetSupplyPicker('food')"
          >
            <span><img :src="feedArt.muffin" alt="" draggable="false" /></span>
            喂食
          </button>
          <button
            type="button"
            :class="{ active: homePetSupplyPicker === 'medicine' }"
            @click="toggleHomePetSupplyPicker('medicine')"
          >
            <span><img :src="bpPillArt" alt="" draggable="false" /></span>
            喂药
          </button>
          <button type="button" @click="playWithHomePet">
            <span><img :src="feedArt.strawberry" alt="" draggable="false" /></span>
            玩耍
          </button>
          <button type="button" @click="napWithHomePet">
            <span><img :src="sedativeArt" alt="" draggable="false" /></span>
            小睡
          </button>
        </div>
      </footer>

      <section v-if="homePetSupplyPicker" class="home-pet-supply-popover" aria-live="polite">
        <header>
          <strong>{{ homePetSupplyTitle }}</strong>
          <button type="button" aria-label="关闭背包小框" @click="homePetSupplyPicker = null"></button>
        </header>
        <div v-if="homePetSupplyEntries.length" class="home-pet-supply-list">
          <button
            v-for="entry in homePetSupplyEntries"
            :key="`home-pet-supply-${entry.item.id}`"
            type="button"
            @click="useHomePetSupplyItem(entry.item)"
          >
            <span class="home-pet-supply-icon">
              <img :src="getSupplyVisual(entry.item.id)" :alt="entry.item.name" draggable="false" />
            </span>
            <span>
              <strong>{{ entry.item.name }}</strong>
              <small>{{ wc.formatPetBoost(entry.item.petBoost) || entry.item.tag }}</small>
            </span>
            <em>x{{ entry.quantity }}</em>
          </button>
        </div>
        <div v-else class="home-pet-supply-empty">
          <p>{{ homePetSupplyEmptyText }}</p>
          <button type="button" @click="openHomePetSupplyShop">去补给仓</button>
        </div>
      </section>
    </article>
  </section>


    <article class="quest-daily-card" aria-label="每日任务">
      <header class="quest-daily-head">
        <div>
          <span class="eyebrow">每日任务</span>
          <h3>今天的三件小事</h3>
        </div>
        <small>每天零点刷新，完成领爪币</small>
      </header>
      <ul class="quest-daily-list">
        <li
          v-for="quest in wc.dailyQuestViews"
          :key="quest.id"
          class="quest-item"
          :class="{ done: quest.claimable, claimed: quest.claimed }"
        >
          <span class="quest-item-icon">{{ quest.icon }}</span>
          <span class="quest-item-body">
            <strong>{{ quest.name }}</strong>
            <small>{{ quest.description }} · {{ quest.current }}/{{ quest.target }}</small>
            <i class="quest-item-bar"><b :style="{ width: `${Math.min(100, Math.round((quest.current / quest.target) * 100))}%` }"></b></i>
          </span>
          <button
            v-if="!quest.claimed"
            type="button"
            class="quest-claim-button"
            :disabled="!quest.claimable"
            @click="wc.claimQuest(quest.id)"
          >
            +{{ quest.reward }}
          </button>
          <span v-else class="quest-claimed-mark">已领 ✓</span>
        </li>
      </ul>
    </article>

  <section class="two-column home-bottom-row">
    <article class="panel-block wish-workbench-panel">
      <header class="panel-header">
        <div>
          <span class="eyebrow">实体心愿拆分台</span>
          <h3>{{ wc.state.wish }}</h3>
        </div>
        <strong>{{ wc.wishCollected ? '已入背包' : `${wc.formatMoney(wc.wishRemaining)} 待点亮` }}</strong>
      </header>
      <div class="segmented wish-workbench-tabs">
        <button type="button" :class="{ active: wc.accountTab === 'split' }" @click="wc.accountTab = 'split'">当前拆分</button>
        <button type="button" @click="emit('openRealized')">
          已实现 <em>{{ wc.earnedGoods.length }}</em>
        </button>
      </div>
      <div
        class="wish-progress"
        :style="{ '--wish-progress': `${Math.round(wc.wishProgress * 100)}%` }"
        aria-label="实体心愿点亮进度"
      >
        <i :style="{ width: `${wc.wishProgress * 100}%` }" aria-hidden="true"></i>
        <span class="bar-label">{{ Math.round(wc.wishProgress * 100) }}%</span>
      </div>
      <div class="wish-workbench-body">
        <div class="macbook-split asset-macbook" :class="{ complete: wc.wishReady }" :aria-label="`${wc.state.wish} 零件点亮图`" role="group">
          <img v-if="wc.wishReady" :src="activeWishVisual.full" class="macbook-full-render" alt="" draggable="false" />
          <button
            v-else
            v-for="part in wishParts"
            :key="`object-${part.id}`"
            type="button"
            class="wish-part-hotspot"
            :class="{ on: part.unlocked }"
            :style="part.artStyle"
            :aria-describedby="`wish-part-tip-${part.id}`"
            :aria-disabled="part.unlocked || wc.wishCollected"
            :aria-label="`${part.name}，${part.unlocked ? '已点亮' : wc.formatMoney(part.price, 0)}。${part.narrative}`"
            @pointerenter="showWishPartTooltip(part.id, $event)"
            @pointerleave="hideWishPartTooltip(part.id)"
            @focus="showWishPartTooltip(part.id, $event)"
            @blur="hideWishPartTooltip(part.id)"
            @click="!part.unlocked && !wc.wishCollected && wc.buyPart(part.id)"
          >
            <img :src="part.image" :class="['mac-art-part', { on: part.unlocked }]" alt="" draggable="false" />
          </button>
          <em>{{ wc.wishReady ? 'READY TO ASSEMBLE' : '2D EXPLODED VIEW' }}</em>
        </div>
        <button v-if="wc.wishReady" type="button" class="primary-button full wish-assemble-button" @click="wc.claimWishReward">
          {{ wc.wishCollected ? '重播拼装鼓励' : '开始零件拼装' }}
        </button>
      </div>
    </article>

    <article
      class="panel-block ledger-summary-card"
      role="button"
      tabindex="0"
      @click="emit('openLedger')"
      @keydown.enter.prevent="emit('openLedger')"
      @keydown.space.prevent="emit('openLedger')"
    >
      <header class="panel-header ledger-summary-head">
        <div>
          <span class="eyebrow">账本</span>
          <h3>交易记录</h3>
        </div>
        <span>{{ wc.state.transactions.length }} 笔</span>
      </header>
      <div class="ledger-summary-metrics">
        <article>
          <span>本月收入</span>
          <strong class="plus">{{ wc.formatMoney(wc.monthlyStats.income) }}</strong>
        </article>
        <article>
          <span>本月支出</span>
          <strong class="minus">{{ wc.formatMoney(-wc.monthlyStats.expense) }}</strong>
        </article>
        <article>
          <span>净额</span>
          <strong :class="wc.monthlyStats.net >= 0 ? 'plus' : 'minus'">{{ wc.formatMoney(wc.monthlyStats.net) }}</strong>
        </article>
      </div>
    </article>
  </section>
</section>
<span
  v-if="activeWishTooltipPart"
  :id="`wish-part-tip-${activeWishTooltipPart.id}`"
  class="wish-part-floating-tooltip visible"
  :class="wishTooltipClass(activeWishTooltipPart.id)"
  :style="wishTooltipStyle(activeWishTooltipPart.id)"
  role="tooltip"
>
  <strong>{{ activeWishTooltipPart.name }}</strong>
  <em>{{ activeWishTooltipPart.unlocked ? "已点亮" : wc.formatMoney(activeWishTooltipPart.price, 0) }}</em>
  <small>{{ activeWishTooltipPart.narrative }}</small>
</span>
</template>
