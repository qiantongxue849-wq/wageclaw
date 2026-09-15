<script setup lang="ts">
import { computed, ref, watch } from "vue";
import GameShell from "@/components/games/GameShell.vue";
import GameResultCard from "@/components/games/GameResultCard.vue";
import GameHud from "@/components/games/GameHud.vue";
import PetSprite from "@/components/PetSprite.vue";
import type { WageClawStore } from "@/composables/useWageClaw";
import type { DuelSkill } from "@/composables/games";

/**
 * 桌面切磋 V2：对称生命 HUD + 城市舞台 + 命令台。
 * 引擎状态来自 wc.duel；本组件只做呈现与轻量残影计算。
 */
const props = defineProps<{ wc: WageClawStore }>();
const emit = defineEmits<{ exit: [] }>();

const skillGroups = [
  {
    group: "基础攻击",
    skills: [
      { skill: "punch", key: "J", name: "普通拳", note: "+12 爆发", cost: 0, tone: "" },
      { skill: "kick", key: "K", name: "反弹脚", note: "+9 爆发", cost: 0, tone: "" },
      { skill: "dash", key: "Q / E", name: "闪身", note: "8 爆发", cost: 8, tone: "" }
    ]
  },
  {
    group: "爆发技能",
    skills: [
      { skill: "uppercut", key: "I", name: "嘴替暴击", note: "24 爆发", cost: 24, tone: "power" },
      { skill: "blast", key: "L", name: "怨气波", note: "36 爆发", cost: 36, tone: "power" }
    ]
  },
  {
    group: "生存",
    skills: [
      { skill: "heal", key: "H", name: "安抚回血", note: "恢复 18", cost: 22, tone: "safe" },
      { skill: "guard", key: "⇧", name: "格挡", note: "减伤 60%", cost: 0, tone: "safe" }
    ]
  }
] as const;

const playerDamages = computed(() => props.wc.duel.fx.damages.filter((d) => d.side === "player"));
const bossDamages = computed(() => props.wc.duel.fx.damages.filter((d) => d.side === "boss"));
const isActive = computed(() => props.wc.duel.active);
const isEnemyActing = computed(() => props.wc.duel.fx.enemyActing);

/** 生命残影层：即时条先掉，残影条 260ms 后追上 */
const playerGhost = ref(100);
const bossGhost = ref(100);
watch(
  () => props.wc.duel.playerHp,
  (value) => {
    window.setTimeout(() => {
      playerGhost.value = value;
    }, 280);
  }
);
watch(
  () => props.wc.duel.enemyHp,
  (value) => {
    window.setTimeout(() => {
      bossGhost.value = value;
    }, 280);
  }
);

function skillDisabled(cost: number) {
  return isEnemyActing.value || props.wc.duel.energy < cost;
}

function skillGap(cost: number) {
  const gap = cost - props.wc.duel.energy;
  return gap > 0 ? `还差 ${gap}` : "";
}

const hudItems = computed(() => [
  { label: "回合", value: `第 ${props.wc.duel.round} 回合` },
  { label: "本局最大连击", value: `x${props.wc.duel.maxCombo}` }
]);

const resultStats = computed(() => [
  { label: "本局回合", value: props.wc.duel.round },
  { label: "最大连击", value: `x${props.wc.duel.maxCombo}` },
  { label: "累计战绩", value: `${props.wc.state.pet.battleWins} 胜 / ${props.wc.state.pet.battleLosses} 负` }
]);

function onPrimary() {
  props.wc.startDuel();
}

function onSecondary() {
  emit("exit");
}
</script>

<template>
  <GameShell
    game="duel"
    title="桌面切磋"
    subtitle="策略回合制 · 与软团并肩出战"
    :active="isActive"
    @exit="emit('exit')"
  >
    <template #actions>
      <span class="game-chip">连击 x{{ wc.duel.combo }}</span>
    </template>

    <div class="game-body duel-layout">
      <section class="battle-stage">
        <div class="city" aria-hidden="true"></div>
        <div class="battle-hud">
          <div class="fighter-hud">
            <span class="avatar" aria-hidden="true">🐾</span>
            <div class="hp-block">
              <strong>你 · 软团</strong>
              <div class="hp">
                <i class="hp-ghost" :style="{ width: `${playerGhost}%` }"></i>
                <b :style="{ width: `${wc.duel.playerHp}%` }"></b>
                <small>{{ wc.duel.playerHp }} / 100</small>
              </div>
            </div>
          </div>
          <div class="round-pill">
            <strong>{{ wc.duel.result ? (wc.duel.result === "胜利" ? "你赢了" : "软团被打散") : isEnemyActing ? "老板反击中" : "你的回合" }}</strong>
            <span>第 {{ wc.duel.round }} 回合</span>
          </div>
          <div class="fighter-hud boss-side">
            <div class="hp-block">
              <strong>老板怨念体</strong>
              <div class="hp">
                <i class="hp-ghost" :style="{ width: `${bossGhost}%` }"></i>
                <b :style="{ width: `${wc.duel.enemyHp}%` }"></b>
                <small>{{ wc.duel.enemyHp }} / 100</small>
              </div>
            </div>
            <span class="avatar" aria-hidden="true">😤</span>
          </div>
        </div>

        <div class="battlefield">
          <div class="combatant-slot player" :class="wc.duel.fx.playerMotion ? `motion-${wc.duel.fx.playerMotion}` : ''">
            <div class="dmg-layer">
              <span v-for="dmg in playerDamages" :key="dmg.id" class="dmg-pop" :class="dmg.kind">{{ dmg.text }}</span>
            </div>
            <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" mode="mini" />
          </div>
          <div class="combatant-slot boss" :class="wc.duel.fx.bossMotion ? `motion-${wc.duel.fx.bossMotion}` : ''">
            <div class="dmg-layer">
              <span v-for="dmg in bossDamages" :key="dmg.id" class="dmg-pop" :class="dmg.kind">{{ dmg.text }}</span>
            </div>
            <div class="boss-paper" aria-hidden="true">
              <span class="boss-head">😤</span>
              <span class="boss-suit"></span>
              <span class="boss-tie"></span>
            </div>
          </div>
        </div>

        <div class="battle-ticker">{{ wc.duel.status }}</div>

        <transition name="verdict-pop">
          <GameResultCard
            v-if="wc.duel.result"
            class="stage-overlay"
            :kind="wc.duel.result === '胜利' ? 'win' : 'lose'"
            :title="wc.duel.result === '胜利' ? '怨念体退散！' : '软团被打散了'"
            :stats="resultStats"
            :reward-line="wc.duel.rewardLine"
            @primary="onPrimary"
            @secondary="onSecondary"
          />
        </transition>
      </section>

      <section class="command-deck">
        <div class="duel-energy">
          <span>爆发能量</span>
          <i class="duel-energy-bar"><b :style="{ width: `${wc.duel.energy}%` }"></b></i>
          <em class="duel-energy-num">{{ wc.duel.energy }} / 100</em>
        </div>
        <div class="command-groups">
          <div v-for="group in skillGroups" :key="group.group" class="command-group">
            <small class="command-group-name">{{ group.group }}</small>
            <div class="command-group-skills">
              <button
                v-for="entry in group.skills"
                :key="entry.skill"
                type="button"
                class="skill-button"
                :class="[entry.tone ? `tone-${entry.tone}` : '', { locked: skillDisabled(entry.cost) }]"
                :disabled="skillDisabled(entry.cost)"
                @click="wc.performDuelSkill(entry.skill as DuelSkill)"
              >
                <i class="tiny-kbd" aria-hidden="true">{{ entry.key }}</i>
                <span class="skill-name">{{ entry.key }} {{ entry.name }}</span>
                <small class="skill-note">{{ skillDisabled(entry.cost) && entry.cost ? skillGap(entry.cost) : entry.note }}</small>
              </button>
            </div>
          </div>
        </div>
        <GameHud :items="hudItems" class="duel-mini-hud" />
      </section>
    </div>
  </GameShell>
</template>
