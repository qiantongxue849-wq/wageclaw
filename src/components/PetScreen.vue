<script setup lang="ts">
import { computed } from "vue";
import { useHomePetSupply as createHomePetSupply } from "@/composables/useHomePetSupply";
import GameLobby from "@/components/games/GameLobby.vue";
import PetSprite from "@/components/PetSprite.vue";
import { bpPillArt, feedArt, resolveSupplyVisual, sedativeArt } from "@/data/visuals";
import { achievementCategories } from "@/data/achievements";
import type { PetStyle } from "@/types";
import type { WageClawStore } from "@/composables/useWageClaw";

const props = defineProps<{ wc: WageClawStore }>();

const supply = createHomePetSupply(props.wc);
const homePetSupplyPicker = supply.homePetSupplyPicker;
const homePetSupplyEntries = supply.homePetSupplyEntries;
const homePetSupplyTitle = supply.homePetSupplyTitle;
const homePetSupplyEmptyText = supply.homePetSupplyEmptyText;
const toggleHomePetSupplyPicker = supply.toggleHomePetSupplyPicker;
const playWithHomePet = supply.playWithHomePet;
const napWithHomePet = supply.napWithHomePet;
const openHomePetSupplyShop = supply.openHomePetSupplyShop;
const useHomePetSupply = supply.useHomePetSupplyItem;

const petMotionAction = computed(() => (props.wc.petReaction === "play" || props.wc.petReaction === "sleep" ? props.wc.petReaction : "idle"));
const petStatusBadges = computed(() => {
  const calm = props.wc.state.pet.bloodPressure < 130 ? "血压稳定" : "需要降压";
  const mood = props.wc.state.pet.affection >= 60 ? "无忧无虑" : props.wc.state.pet.touchMood;
  return [props.wc.petAscension.active ? props.wc.petAscension.label : calm, props.wc.petAffinity.label, mood];
});
const petAttributeRows = computed(() => props.wc.petAttributes);

const achievementGroups = computed(() => {
  const order = ["salary", "rage", "pet", "games", "wish"] as const;
  return order.map((category) => ({
    category,
    icon: achievementCategories[category].icon,
    label: achievementCategories[category].label,
    items: props.wc.achievementViews.filter((item) => item.category === category)
  }));
});
const unlockedCount = computed(() => props.wc.achievementViews.filter((item) => item.unlocked).length);
const petStyleEntries = computed(() => Object.entries(props.wc.petStyleLabels) as Array<[PetStyle, string]>);

function getSupplyVisual(itemId: string) {
  return resolveSupplyVisual(itemId);
}

function onPlayGame(game: "duel" | "gomoku" | "runner") {
  if (game === "duel") {
    props.wc.startDuel();
  } else if (game === "gomoku") {
    props.wc.startGomoku();
  } else {
    props.wc.startRunner();
  }
}
</script>

<template>
<section v-show="wc.activeScreen === 'pet'" class="screen-grid pet-screen-redesign">
  <article class="home-pet-status-card pet-page-status-card" :style="wc.petStageStyle()" aria-label="桌宠属性">
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
          <span v-for="badge in petStatusBadges" :key="`pet-page-badge-${badge}`">{{ badge }}</span>
        </div>
      </section>

      <section class="home-pet-attrs" aria-label="基础属性">
        <div
          v-for="row in petAttributeRows"
          :key="`pet-page-${row.label}`"
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
          :key="`pet-page-supply-${entry.item.id}`"
          type="button"
          @click="useHomePetSupply(entry.item)"
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

  <section class="pet-workbench-grid">
    <article class="panel-block pet-refine-lab pet-refine-lab--dialog">
      <div class="pet-refine-body">
        <header class="panel-header">
          <div>
            <span class="eyebrow">炼化</span>
            <h3>把糟心事炼成怨气</h3>
          </div>
          <span>今日 {{ Math.round(wc.state.dailyRage.value) }}</span>
        </header>
        <textarea
          v-model="wc.rantText"
          rows="5"
          placeholder="把今天最烦的一句话丢进炉子里，软团会帮你收好。"
        ></textarea>
        <div class="refine-meter">
          <span>炉温</span>
          <i><b :style="{ width: `${Math.min(100, 34 + wc.state.dailyRage.value / 10)}%` }"></b></i>
          <strong>{{ wc.state.pet.rage >= 500 ? "满溢" : "可炼化" }}</strong>
        </div>
        <div class="action-row pet-refine-actions">
          <button type="button" class="primary-button" @click="wc.refineRageFromRant">开始炼化</button>
          <button type="button" class="secondary-button" @click="wc.cultivatePet">怨气修炼</button>
        </div>
      </div>
    </article>

    <article class="panel-block pet-arcade-lab" aria-label="桌面游戏">
      <header class="panel-header">
        <div>
          <span class="eyebrow">桌面游戏</span>
          <h3>解压游戏厅</h3>
        </div>
        <span v-if="wc.state.pet.gameBest > 0">闯关最佳 {{ wc.state.pet.gameBest }}</span>
      </header>
      <GameLobby :wc="wc" @play="onPlayGame" />
    </article>

    <article class="panel-block pet-achievement-hall" aria-label="成就殿堂">
      <header class="panel-header">
        <div>
          <span class="eyebrow">成就殿堂</span>
          <h3>把忍耐的里程碑都留下来</h3>
        </div>
        <span>{{ unlockedCount }} / {{ wc.achievementViews.length }} 已解锁</span>
      </header>
      <div class="achievement-category-list">
        <section v-for="group in achievementGroups" :key="group.category" class="achievement-category-group">
          <h4>{{ group.icon }} {{ group.label }}</h4>
          <ul class="achievement-list">
            <li
              v-for="item in group.items"
              :key="item.id"
              class="achievement-chip"
              :class="{ unlocked: item.unlocked }"
              :title="item.description"
            >
              <span class="achievement-chip-icon">{{ item.unlocked ? item.icon : "🔒" }}</span>
              <span class="achievement-chip-body">
                <strong>{{ item.name }}</strong>
                <small>{{ item.unlocked ? "已解锁" : `${item.current} / ${item.target}` }}</small>
                <i class="achievement-chip-bar"><b :style="{ width: `${Math.min(100, Math.round((item.current / item.target) * 100))}%` }"></b></i>
              </span>
              <em class="achievement-chip-reward">+{{ item.reward }}</em>
            </li>
          </ul>
        </section>
      </div>
    </article>

  </section>

  <article class="panel-block pet-evolution-preview" :style="wc.petStageStyle()" aria-label="当前桌宠 1 到 10 级进化预览">
    <header class="pet-evolution-preview-head">
      <div>
        <span class="eyebrow">进化图鉴</span>
        <h3>{{ wc.petStyleLabels[wc.state.petStyle] }} 1-10 级形象</h3>
      </div>
      <div class="pet-evolution-preview-tools">
        <label>
          <span>形象</span>
          <select v-model="wc.state.petStyle" aria-label="切换桌宠形象">
            <option v-for="[key, label] in petStyleEntries" :key="`pet-preview-style-${key}`" :value="key">
              {{ label }}
            </option>
          </select>
        </label>
        <strong>当前 Lv.{{ wc.currentPetStage.level }}</strong>
      </div>
    </header>
    <div class="pet-evolution-strip">
      <article
        v-for="stage in wc.petStages"
        :key="`pet-evolution-preview-${stage.id}`"
        class="pet-evolution-tile"
        :class="{ current: wc.currentPetStage.id === stage.id, unlocked: wc.state.pet.growth >= stage.threshold }"
        :style="wc.petStageStyle(stage)"
        :aria-current="wc.currentPetStage.id === stage.id ? 'step' : undefined"
      >
        <span class="pet-evolution-level">Lv.{{ stage.level }}</span>
        <div class="pet-evolution-art">
          <PetSprite :stage="stage" :ascension="wc.currentPetStage.id === stage.id ? wc.petAscension : undefined" mode="mini" />
        </div>
        <strong>{{ stage.name }}</strong>
        <small>{{ wc.state.pet.growth >= stage.threshold ? "已解锁" : `${stage.threshold} 成长` }}</small>
      </article>
    </div>
    <div v-if="wc.petAscension.active" class="pet-ascension-panel" :style="wc.petStageStyle()">
      <div>
        <span>顶阶星阶</span>
        <strong>{{ wc.petAscension.nextLabel }}</strong>
        <small>继续炼化怨气，给满级形象叠加新的灵纹、光环和能量上限。</small>
      </div>
      <div class="pet-ascension-meter">
        <em>{{ wc.petAscension.progressGrowth }} / {{ wc.petAscension.cycle }}</em>
        <i><b :style="{ width: `${Math.round(wc.petAscension.progress * 100)}%` }"></b></i>
        <span>还差 {{ wc.petAscension.remaining }} 成长</span>
      </div>
    </div>
  </article>
</section>
</template>
