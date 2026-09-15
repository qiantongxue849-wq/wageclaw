<script setup lang="ts">
import { computed, ref } from "vue";
import type { WageClawStore } from "@/composables/useWageClaw";

/**
 * 解压游戏厅：桌宠页的游戏入口模块。
 * 英雄横幅（任务进度 / 活动额度）+ 三张玩法卡（迷你场景 / 数据 / 一键开局）。
 */
const props = defineProps<{ wc: WageClawStore }>();
const emit = defineEmits<{ play: [game: "duel" | "gomoku" | "runner"] }>();

const DAILY_EVENT_CAP = 140;
const helpOpen = ref<"duel" | "gomoku" | "runner" | null>(null);

const eventEarned = computed(() => Math.max(0, Math.round(props.wc.state.dailyPaw.eventEarned)));
const eventRemaining = computed(() => Math.max(0, DAILY_EVENT_CAP - eventEarned.value));


/** 今日小游戏任务（没有则展示自由局文案） */
const gameQuest = computed(() => props.wc.dailyQuestViews.find((quest) => quest.metric === "minigame") ?? null);

/** 新手推荐：没玩过闯关先推闯关，否则默认推切磋 */
const recommended = computed(() => (props.wc.state.pet.gameBest === 0 ? "runner" : "duel") as "duel" | "gomoku" | "runner");

const cards = computed(() => [
  {
    game: "duel" as const,
    genre: "策略 · 约 2 分钟",
    name: "桌面切磋",
    desc: "攒爆发、接连击，和软团一起打散老板怨念体。",
    playText: "立即开战",
    facts: [
      { value: "+25", label: "胜利爪币" },
      { value: props.wc.state.pet.battleBestCombo, label: "最佳连击" },
      { value: `${props.wc.state.pet.battleWins} 胜`, label: "累计战绩" }
    ],
    help: ["攒爆发：普通拳/反弹脚不耗爆发还回能量", "连击越高越痛，暴击有 1.6 倍加成", "血量危险用 H 回血或 ⇧ 格挡"]
  },
  {
    game: "gomoku" as const,
    genre: "休闲 · 约 5 分钟",
    name: "五子棋",
    desc: "你执黑先行，和软团安静地下完一盘。",
    playText: "坐下对弈",
    facts: [
      { value: "+20", label: "胜利爪币" },
      { value: "轻松", label: "当前难度" },
      { value: `${props.wc.gomoku.wins} 胜`, label: "本次战绩" }
    ],
    help: ["黑棋先手，横竖斜连成五子即胜", "红点标记软团的最后一手", "悬停可预览落点，想好了再点"]
  },
  {
    game: "runner" as const,
    genre: "反应 · 约 1 分钟",
    name: "怨气闯关",
    desc: "跳过会议和周报，蹲过临时需求与已读。",
    playText: "开始摸鱼",
    facts: [
      { value: "+20", label: "最高爪币" },
      { value: props.wc.state.pet.gameBest, label: "历史最佳" },
      { value: "2.8x", label: "最高速度" }
    ],
    help: ["地面障碍按跳跃，空中怨念按下蹲", "连续躲避攒摸鱼连段，额外加分", "速度会越来越快，撞了也有安慰奖"]
  }
]);

function toggleHelp(game: "duel" | "gomoku" | "runner") {
  helpOpen.value = helpOpen.value === game ? null : game;
}

function openAchievements() {
  document.querySelector(".pet-achievement-hall")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <div class="game-lobby">
    <section class="lobby-hero">
      <div class="lobby-hero-copy">
        <h3>今天想怎么解压？</h3>
        <p>三款游戏共用每日 {{ 140 }} 爪币活动额度<br />成绩会推进桌宠任务和游戏成就。</p>
      </div>
      <div class="lobby-mission">
        <span class="mission-medal" aria-hidden="true">🏅</span>
        <template v-if="gameQuest">
          <div class="mission-copy">
            <strong>{{ gameQuest.claimed ? "今日任务已完成，收好爪币" : gameQuest.claimable ? "任务完成，记得领奖励" : `再完成 ${gameQuest.target - gameQuest.current} 局，领任务奖励` }}</strong>
            <small>任意游戏均可 · 每日零点刷新</small>
          </div>
          <b class="mission-count">{{ gameQuest.current }} / {{ gameQuest.target }}</b>
          <i class="mission-bar"><b :style="{ width: `${Math.round((gameQuest.current / gameQuest.target) * 100)}%` }"></b></i>
        </template>
        <template v-else>
          <div class="mission-copy">
            <strong>今天没有游戏任务，纯粹玩一把</strong>
            <small>任务每日零点刷新</small>
          </div>
          <b class="mission-count">自由局</b>
          <i class="mission-bar"><b style="width: 100%"></b></i>
        </template>
      </div>
    </section>

    <div class="lobby-meta">
      <span class="lobby-cap">今日活动爪币 <b>{{ eventEarned }} / {{ DAILY_EVENT_CAP }}</b>，剩余 {{ eventRemaining }}</span>
      <button type="button" class="lobby-achieve-link" @click="openAchievements">战绩与成就 ↓</button>
    </div>

    <div class="game-grid">
      <article
        v-for="card in cards"
        :key="card.game"
        class="game-card"
        :class="[card.game, { recommended: card.game === recommended }]"
      >
        <div class="card-art" aria-hidden="true">
          <span class="tagline">{{ card.genre }}</span>
          <div v-if="card.game === 'duel'" class="art-duel">
            <div class="mini-boss"><span class="head">😤</span><span class="body"></span><span class="tie"></span></div>
            <span class="art-vs">VS</span>
            <span class="art-pet">🐾</span>
          </div>
          <div v-else-if="card.game === 'gomoku'" class="art-board">
            <i></i><i></i><i></i><i></i><i class="white"></i>
          </div>
          <div v-else class="art-track">
            <span class="art-note">周报</span>
            <span class="art-pet run">🐾</span>
          </div>
        </div>
        <div class="card-copy">
          <h4>{{ card.name }}</h4>
          <p>{{ card.desc }}</p>
          <div class="card-facts">
            <span v-for="fact in card.facts" :key="fact.label"><b>{{ fact.value }}</b>{{ fact.label }}</span>
          </div>
          <div class="card-actions">
            <button type="button" class="card-play" @click="emit('play', card.game)">{{ card.playText }}</button>
            <button
              type="button"
              class="card-help"
              :aria-label="`${card.name}玩法说明`"
              @click="toggleHelp(card.game)"
            >?</button>
          </div>
          <ol v-if="helpOpen === card.game" class="card-help-list">
            <li v-for="(step, index) in card.help" :key="index">{{ step }}</li>
          </ol>
          <span v-if="card.game === recommended" class="recommend-badge">推荐</span>
        </div>
      </article>
    </div>
  </div>
</template>
