<script setup lang="ts">
import { computed } from "vue";
import GameShell from "@/components/games/GameShell.vue";
import GameResultCard from "@/components/games/GameResultCard.vue";
import PetSprite from "@/components/PetSprite.vue";
import type { WageClawStore } from "@/composables/useWageClaw";

/**
 * 五子棋 V2：左侧棋盘（坐标 + 绝对定位棋子 + 金色胜利连线），右侧软团对手席。
 */
const props = defineProps<{ wc: WageClawStore }>();
const emit = defineEmits<{ exit: [] }>();

const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
const isActive = computed(() => props.wc.gomoku.active);
const cellPercent = 100 / props.wc.gomoku.size;

const placedStones = computed(() => {
  const stones: Array<{ row: number; col: number; player: 1 | 2; last: boolean; win: boolean }> = [];
  for (let row = 0; row < props.wc.gomoku.size; row += 1) {
    for (let col = 0; col < props.wc.gomoku.size; col += 1) {
      const value = props.wc.gomoku.board[row][col];
      if (!value) continue;
      stones.push({
        row,
        col,
        player: value as 1 | 2,
        last: props.wc.gomoku.lastMove?.row === row && props.wc.gomoku.lastMove?.col === col,
        win: props.wc.gomoku.winLine.some((cell) => cell.row === row && cell.col === col)
      });
    }
  }
  return stones;
});

/** 胜利连线：从五连首尾格中心画一条金色线 */
const winLine = computed(() => {
  const line = props.wc.gomoku.winLine;
  if (line.length < 2) return null;
  const first = line[0];
  const last = line[line.length - 1];
  const x1 = (first.col + 0.5) * cellPercent;
  const y1 = (first.row + 0.5) * cellPercent;
  const x2 = (last.col + 0.5) * cellPercent;
  const y2 = (last.row + 0.5) * cellPercent;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return { left: `${x1}%`, top: `${y1}%`, width: `${length}%`, transform: `rotate(${angle}deg)` };
});

const lastMoveNote = computed(() => {
  const last = props.wc.gomoku.lastMove;
  if (!last) return "还没有落子，黑棋先行。";
  const color = props.wc.gomoku.board[last.row][last.col] === 1 ? "黑棋" : "白棋";
  return `最近一步：${color} ${COL_LETTERS[last.col]}${last.row + 1}（红点标记）。`;
});

const opponentStatus = computed(() => {
  if (props.wc.gomoku.result) return "这一局结束了";
  if (props.wc.gomoku.thinking) return "正在观察你的斜线";
  return "等你在棋盘落子";
});

function requestRestart() {
  if (props.wc.gomoku.active && !props.wc.gomoku.result) {
    if (!window.confirm("这局还在进行中，重新开始会丢弃当前棋局。确定吗？")) return;
  }
  props.wc.startGomoku();
}

function onPrimary() {
  props.wc.startGomoku();
}

function onSecondary() {
  emit("exit");
}
</script>

<template>
  <GameShell
    game="gomoku"
    title="五子棋"
    subtitle="桌面对弈 · 你执黑先行"
    :active="isActive && !wc.gomoku.result"
    @exit="emit('exit')"
  >
    <template #actions>
      <span class="game-chip">第 {{ wc.gomoku.moves }} 手</span>
      <span class="game-chip">奖励：胜 +20 / 平 +8</span>
    </template>

    <div class="game-body gomoku-layout">
      <section class="board-wrap">
        <div class="board-inner">
          <div class="board-coords board-cols" aria-hidden="true">
            <span v-for="letter in COL_LETTERS" :key="letter">{{ letter }}</span>
          </div>
          <div class="board-mid">
            <div class="board-coords board-rows" aria-hidden="true">
              <span v-for="n in wc.gomoku.size" :key="n">{{ n }}</span>
            </div>
            <div class="board-large">
              <i
                v-for="stone in placedStones"
                :key="`${stone.row}-${stone.col}`"
                class="stone"
                :class="[stone.player === 1 ? 'black' : 'white', { last: stone.last && !stone.win, win: stone.win }]"
                :style="{ left: `${(stone.col + 0.5) * cellPercent}%`, top: `${(stone.row + 0.5) * cellPercent}%` }"
              ></i>
              <span v-if="winLine" class="win-line" :style="winLine"></span>
              <div class="board-clicks" :class="{ locked: !wc.gomoku.playerTurn || Boolean(wc.gomoku.result) }">
                <button
                  v-for="(_, index) in wc.gomoku.size * wc.gomoku.size"
                  :key="index"
                  type="button"
                  :aria-label="`落子 ${COL_LETTERS[index % wc.gomoku.size]}${Math.floor(index / wc.gomoku.size) + 1}`"
                  @click="wc.handleGomokuMove(Math.floor(index / wc.gomoku.size), index % wc.gomoku.size)"
                ></button>
              </div>
              <div v-if="wc.gomoku.result" class="gomoku-verdict">
                <GameResultCard
                  :kind="wc.gomoku.result.includes('你赢') ? 'win' : wc.gomoku.result.includes('平局') ? 'draw' : 'lose'"
                  :title="wc.gomoku.result.includes('你赢') ? '你赢了这局' : wc.gomoku.result.includes('平局') ? '下成了平局' : '软团略胜一筹'"
                  :stats="[
                    { label: '本局手数', value: wc.gomoku.moves },
                    { label: '战绩', value: `${wc.gomoku.wins} 胜 / ${wc.gomoku.losses} 负 / ${wc.gomoku.draws} 平` }
                  ]"
                  :reward-line="wc.gomoku.result"
                  @primary="onPrimary"
                  @secondary="onSecondary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="opponent-panel">
        <div class="opponent-head">
          <div class="opponent-avatar" :class="{ thinking: wc.gomoku.thinking }">
            <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" mode="mini" />
            <i v-if="wc.gomoku.thinking" class="think-ripple" aria-hidden="true"></i>
          </div>
          <div>
            <strong>软团 · 白棋</strong>
            <span>{{ opponentStatus }}</span>
          </div>
        </div>
        <div class="turn-card" :data-state="wc.gomoku.result ? 'over' : wc.gomoku.playerTurn ? 'you' : 'ai'">
          <small>当前回合</small>
          <b>{{ wc.gomoku.result ? "已结算" : wc.gomoku.playerTurn ? "轮到你落子" : "软团思考中" }}</b>
        </div>
        <div class="score-strip">
          <span><b>{{ wc.gomoku.wins }}</b>胜</span>
          <span><b>{{ wc.gomoku.losses }}</b>负</span>
          <span><b>{{ wc.gomoku.draws }}</b>平</span>
        </div>
        <div class="move-note">{{ lastMoveNote }}</div>
        <div class="difficulty">
          <button type="button" :class="{ active: wc.gomoku.difficulty === 'easy' }" @click="wc.gomoku.difficulty = 'easy'">轻松</button>
          <button type="button" class="locked" :class="{ active: wc.gomoku.difficulty === 'hard' }" disabled title="认真难度准备中">认真 🔒</button>
        </div>
        <button type="button" class="gomoku-restart" @click="requestRestart">重新开始</button>
      </aside>
    </div>
  </GameShell>
</template>
