/**
 * 内置小游戏引擎：桌面切磋（回合制格斗）、五子棋（对弈 AI）、怨气闯关（跑酷）。
 * 每个游戏是独立的工厂函数，通过 deps 注入经济系统（爪币）、日志与桌宠数值，
 * 与主 store 保持单向依赖，便于单独测试和后续新增玩法。
 *
 * 表现层约定：引擎只负责维护 fx 状态（动作位/伤害数字/震动标记），DOM 呈现交给组件。
 */
import { reactive } from "vue";
import type { WageClawState } from "@/types";
import { clamp, randomPick } from "@/utils/core";

type PawCoinAdder = (amount: number, source: string, bucket: "attendance" | "interaction" | "event", silent?: boolean) => number;
type PetLogger = (title: string, detail: string) => void;

export type DuelSkill = "punch" | "kick" | "uppercut" | "blast" | "heal" | "guard" | "dash";

export type DuelDamage = {
  id: number;
  side: "player" | "boss";
  text: string;
  kind: "hit" | "crit" | "heal" | "taken" | "blocked";
};

/** 桌面切磋：老板怨念体回合制对战，桌宠等级提供伤害加成与减伤 */
export function createDuelGame(deps: {
  state: WageClawState;
  petManaMax: () => number;
  petLevel: () => number;
  addPawCoins: PawCoinAdder;
  addPetLog: PetLogger;
  notify: (message: string) => void;
  onGameEnd?: () => void;
}) {
  const { state, addPawCoins, addPetLog, notify } = deps;
  const duel = reactive({
    visible: false,
    active: false,
    playerHp: 100,
    enemyHp: 100,
    energy: 42,
    mana: 32,
    combo: 0,
    phase: "待命中",
    status: "点击开战后，可用 J/K/I/L/H 或按钮出招。",
    result: "",
    round: 0,
    maxCombo: 0,
    rewardLine: "",
    /** 表现层状态：动作位、飘字、震屏 */
    fx: {
      playerMotion: "" as "" | "lunge" | "cast" | "heal" | "guard" | "hurt" | "down",
      bossMotion: "" as "" | "hurt" | "lunge" | "down",
      damages: [] as DuelDamage[],
      shake: false,
      enemyActing: false
    }
  });

  let damageSeq = 0;
  let fxToken = 0;

  function pushDamage(side: DuelDamage["side"], text: string, kind: DuelDamage["kind"]) {
    const id = (damageSeq += 1);
    duel.fx.damages.push({ id, side, text, kind });
    window.setTimeout(() => {
      const index = duel.fx.damages.findIndex((entry) => entry.id === id);
      if (index >= 0) duel.fx.damages.splice(index, 1);
    }, 950);
  }

  /** 动作位复位：仅当期间没有更新的动作时才清空，避免互相打断 */
  function scheduleFxReset() {
    const token = (fxToken += 1);
    window.setTimeout(() => {
      if (fxToken !== token) return;
      if (duel.fx.playerMotion !== "down") duel.fx.playerMotion = "";
      if (duel.fx.bossMotion !== "down") duel.fx.bossMotion = "";
      duel.fx.shake = false;
    }, 500);
  }

  function startDuel() {
    duel.visible = true;
    duel.active = true;
    duel.playerHp = 100;
    duel.enemyHp = 100;
    duel.energy = 42;
    duel.mana = Math.min(deps.petManaMax(), Math.max(32, state.pet.mana));
    duel.combo = 0;
    duel.phase = "开战";
    duel.status = "老板怨念体已出现，先用 J/K 试探距离。";
    duel.result = "";
    duel.round = 0;
    duel.maxCombo = 0;
    duel.rewardLine = "";
    duel.fx.enemyActing = false;
    duel.fx.playerMotion = "";
    duel.fx.bossMotion = "";
    duel.fx.damages = [];
    duel.fx.shake = false;
  }

  function performDuelSkill(skill: DuelSkill) {
    if (!duel.active) startDuel();
    if (!duel.active) return;
    const moves = {
      punch: { label: "普通拳", damage: 10, cost: 0, gain: 12 },
      kick: { label: "反弹脚", damage: 16, cost: 0, gain: 9 },
      uppercut: { label: "嘴替暴击", damage: 24, cost: 24, gain: 4 },
      blast: { label: "怨气波", damage: 30, cost: 36, gain: 0 },
      heal: { label: "安抚回血", damage: -18, cost: 22, gain: 0 },
      guard: { label: "格挡", damage: 0, cost: 0, gain: 18 },
      dash: { label: "闪身", damage: 4, cost: 8, gain: 10 }
    };
    const move = moves[skill];
    if (move.cost > duel.energy) {
      duel.status = `${move.label} 需要 ${move.cost} 爆发，当前不够。`;
      return;
    }
    duel.energy = clamp(duel.energy - move.cost + move.gain, 0, 100);
    duel.round += 1;
    if (skill === "heal") {
      const healed = Math.abs(move.damage);
      duel.fx.playerMotion = "heal";
      duel.playerHp = clamp(duel.playerHp + healed, 0, 100);
      pushDamage("player", `+${healed}`, "heal");
      duel.status = "你先把自己的血条拉回来。";
    } else if (skill === "guard") {
      duel.fx.playerMotion = "guard";
      duel.status = "格挡成功，下一波离谱需求被弹开一半。";
    } else {
      duel.fx.playerMotion = skill === "blast" ? "cast" : "lunge";
      const crit = Math.random() * 100 < 15;
      // 桌宠等级接入伤害：养成进度让招式变强（每级 +0.6 基础伤害）
      const levelBonus = 2 + deps.petLevel() * 0.6;
      const damage = Math.round(move.damage * (crit ? 1.6 : 1) + levelBonus);
      duel.enemyHp = clamp(duel.enemyHp - damage, 0, 100);
      duel.combo += 1;
      duel.maxCombo = Math.max(duel.maxCombo, duel.combo);
      pushDamage("boss", crit ? `暴击 ${damage}!` : `${damage}`, crit ? "crit" : "hit");
      duel.fx.bossMotion = "hurt";
      if (crit || skill === "blast") duel.fx.shake = true;
      duel.status = `${move.label}${crit ? "暴击" : "命中"}，造成 ${damage} 点伤害。`;
    }
    scheduleFxReset();
    if (duel.enemyHp <= 0) {
      endDuel(true);
      return;
    }
    // 给出手感停顿：我方动作先播，boss 再还手（期间锁技能区）
    duel.fx.enemyActing = true;
    window.setTimeout(() => enemyTurn(skill === "guard"), 300);
  }

  function enemyTurn(guarding = false) {
    if (!duel.active) {
      duel.fx.enemyActing = false;
      return;
    }
    // 敌方伤害随桌宠等级减免（每级 -0.5，封顶 6），保证高养成后稳定可赢
    const levelGuard = Math.min(6, deps.petLevel() * 0.5);
    const raw = Math.max(4, Math.round(9 + Math.random() * 10 - levelGuard));
    const finalDamage = guarding ? Math.round(raw * 0.4) : raw;
    duel.fx.bossMotion = "lunge";
    window.setTimeout(() => {
      if (!duel.active) return;
      duel.playerHp = clamp(duel.playerHp - finalDamage, 0, 100);
      duel.fx.playerMotion = guarding ? "guard" : "hurt";
      pushDamage("player", guarding ? `挡住 ${finalDamage}` : `${finalDamage}`, guarding ? "blocked" : "taken");
      duel.phase = guarding ? "格挡反击" : "交锋中";
      duel.fx.enemyActing = false;
      scheduleFxReset();
      if (duel.playerHp <= 0) {
        endDuel(false);
      }
    }, 200);
  }

  function endDuel(win: boolean) {
    deps.onGameEnd?.();
    duel.active = false;
    duel.fx.enemyActing = false;
    duel.result = win ? "胜利" : "失败";
    duel.phase = win ? "你赢了" : "软团被打散";
    duel.fx.playerMotion = win ? "" : "down";
    duel.fx.bossMotion = win ? "down" : "";
    let rewardLine = "";
    if (win) {
      state.pet.battleWins += 1;
      const reward = addPawCoins(25, "桌面切磋获胜", "event", true);
      rewardLine = reward > 0 ? `奖励入账 +${reward} 爪币。` : "今日活动爪币已领满。";
    } else {
      state.pet.battleLosses += 1;
    }
    duel.status = (win ? "老板怨念体暂时退散。" : "这局先撤，补给一下再来。") + rewardLine;
    duel.rewardLine = rewardLine;
    state.pet.battleBestCombo = Math.max(state.pet.battleBestCombo, duel.combo);
    addPetLog(win ? "工位对战胜利" : "工位对战失利", `连击 ${duel.combo}，${rewardLine}当前战绩 ${state.pet.battleWins} 胜 / ${state.pet.battleLosses} 负。`);
  }

  function previewOnlineBattle() {
    notify(randomPick(["联机协议层已预留，可接房间号和战绩榜。", "当前先开放本地对战，联机入口保留。"]));
  }

  return { duel, startDuel, performDuelSkill, previewOnlineBattle };
}

/** 五子棋：贪心评分 AI，胜负平都发活动爪币 */
export function createGomokuGame(deps: { addPawCoins: PawCoinAdder; addPetLog: PetLogger; onGameEnd?: () => void }) {
  const { addPawCoins, addPetLog } = deps;
  const gomoku = reactive({
    visible: false,
    active: false,
    size: 15,
    board: Array.from({ length: 15 }, () => Array<number>(15).fill(0)),
    playerTurn: true,
    thinking: false,
    difficulty: "easy" as "easy" | "hard",
    moves: 0,
    lastMove: null as { row: number; col: number } | null,
    winLine: [] as Array<{ row: number; col: number }>,
    wins: 0,
    losses: 0,
    draws: 0,
    result: ""
  });

  function startGomoku() {
    gomoku.visible = true;
    gomoku.active = true;
    gomoku.playerTurn = true;
    gomoku.thinking = false;
    gomoku.moves = 0;
    gomoku.lastMove = null;
    gomoku.winLine = [];
    gomoku.result = "";
    gomoku.board = Array.from({ length: gomoku.size }, () => Array<number>(gomoku.size).fill(0));
  }

  function stopGomoku() {
    gomoku.visible = false;
    gomoku.active = false;
    gomoku.thinking = false;
  }

  function handleGomokuMove(row: number, col: number) {
    if (!gomoku.active || !gomoku.playerTurn || gomoku.board[row][col]) return;
    gomoku.board[row][col] = 1;
    gomoku.moves += 1;
    gomoku.lastMove = { row, col };
    const playerLine = checkGomokuWin(1);
    if (playerLine.length > 0) {
      gomoku.wins += 1;
      gomoku.winLine = playerLine;
      const reward = addPawCoins(20, "五子棋获胜", "event", true);
      gomoku.result = reward > 0
        ? `你赢了。软团承认你这步有点东西，奖励 +${reward} 爪币。`
        : "你赢了。软团承认你这步有点东西。（今日活动爪币已领满）";
      addPetLog("五子棋获胜", `本轮奖励 +${reward} 爪币，战绩 ${gomoku.wins} 胜 / ${gomoku.losses} 负 / ${gomoku.draws} 平。`);
      gomoku.active = false;
      deps.onGameEnd?.();
      return;
    }
    gomoku.playerTurn = false;
    gomoku.thinking = true;
    window.setTimeout(() => {
      const move = findGomokuMove();
      if (!move) {
        gomoku.draws += 1;
        const reward = addPawCoins(8, "五子棋平局", "event", true);
        gomoku.result = reward > 0 ? `棋盘下满，平局。辛苦费 +${reward} 爪币。` : "棋盘下满，平局。";
        gomoku.active = false;
        gomoku.thinking = false;
        deps.onGameEnd?.();
        return;
      }
      gomoku.board[move.row][move.col] = 2;
      gomoku.moves += 1;
      gomoku.lastMove = { row: move.row, col: move.col };
      if (checkGomokuWin(2).length > 0) {
        gomoku.losses += 1;
        gomoku.winLine = checkGomokuWin(2);
        gomoku.result = "软团赢了。它看起来很得意。";
        gomoku.active = false;
        deps.onGameEnd?.();
      }
      gomoku.playerTurn = true;
      gomoku.thinking = false;
    }, 420);
  }

  function findGomokuMove() {
    const center = Math.floor(gomoku.size / 2);
    const candidates: Array<{ row: number; col: number; score: number }> = [];
    for (let row = 0; row < gomoku.size; row += 1) {
      for (let col = 0; col < gomoku.size; col += 1) {
        if (gomoku.board[row][col]) continue;
        let score = 10 - Math.abs(row - center) - Math.abs(col - center);
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (!dr && !dc) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < gomoku.size && nc >= 0 && nc < gomoku.size) {
              if (gomoku.board[nr][nc] === 2) score += 6;
              if (gomoku.board[nr][nc] === 1) score += 5;
            }
          }
        }
        candidates.push({ row, col, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  /** 返回获胜五连的坐标（用于高亮），未连成返回空数组 */
  function checkGomokuWin(player: number): Array<{ row: number; col: number }> {
    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ];
    for (let row = 0; row < gomoku.size; row += 1) {
      for (let col = 0; col < gomoku.size; col += 1) {
        if (gomoku.board[row][col] !== player) continue;
        for (const [dr, dc] of dirs) {
          const line = [{ row, col }];
          for (let step = 1; step < 5; step += 1) {
            const nr = row + dr * step;
            const nc = col + dc * step;
            if (nr < 0 || nr >= gomoku.size || nc < 0 || nc >= gomoku.size || gomoku.board[nr][nc] !== player) break;
            line.push({ row: nr, col: nc });
          }
          if (line.length >= 5) return line;
        }
      }
    }
    return [];
  }

  return { gomoku, startGomoku, stopGomoku, handleGomokuMove };
}

type RunnerObstacle = {
  id: number;
  kind: string;
  icon: string;
  /** true = 空中障碍，需要下蹲；false = 地面障碍，需要跳跃 */
  high: boolean;
  /** 相对跑道的水平位置：1.05=右侧场外，向 0 移动 */
  x: number;
  passed: boolean;
};

const RUNNER_OBSTACLES: Array<{ kind: string; icon: string; high: boolean }> = [
  { kind: "会议", icon: "📅", high: false },
  { kind: "甩锅", icon: "🍳", high: false },
  { kind: "周报", icon: "📊", high: false },
  { kind: "临需", icon: "⚡", high: true },
  { kind: "已读", icon: "👁️", high: true }
];

/** 怨气闯关：真实移动障碍跑酷，地面障碍跳跃、空中障碍下蹲，速度随分数提升 */
export function createRunnerGame(deps: { state: WageClawState; addPawCoins: PawCoinAdder; addPetLog: PetLogger; onGameEnd?: () => void }) {
  const { state, addPawCoins, addPetLog } = deps;
  const runner = reactive({
    visible: false,
    active: false,
    score: 0,
    best: state.pet.gameBest,
    pose: "ready",
    obstacle: "会议",
    result: "",
    obstacles: [] as RunnerObstacle[],
    crash: false,
    speed: 1,
    streak: 0,
    paused: false,
    tutorial: { active: false, step: 0 }
  });
  let tutorialDone = false;
  let runnerTimer: number | undefined;
  let obstacleSeq = 0;
  let spawnCooldown = 14;

  function spawnObstacle() {
    const template = randomPick(RUNNER_OBSTACLES);
    runner.obstacles.push({
      id: (obstacleSeq += 1),
      kind: template.kind,
      icon: template.icon,
      high: template.high,
      x: 1.08,
      passed: false
    });
  }

  function startRunner() {
    runner.visible = true;
    runner.active = true;
    runner.score = 0;
    runner.pose = "run";
    runner.result = "";
    runner.obstacles = [];
    runner.crash = false;
    runner.speed = 1;
    runner.streak = 0;
    runner.paused = false;
    runner.tutorial = { active: !tutorialDone, step: 0 };
    spawnCooldown = runner.tutorial.active ? 10 : 14;
    startTick();
  }

  function tick() {
    if (!runner.active || runner.paused) return;
      // 新手教学：第一局先教跳（地面）再教蹲（空中），慢速、不计分、碰撞直接穿过
      if (runner.tutorial.active) {
        runner.speed = 0.55;
        spawnCooldown -= 1;
        if (spawnCooldown <= 0 && runner.obstacles.length === 0) {
          const template = RUNNER_OBSTACLES[runner.tutorial.step];
          runner.obstacles.push({
            id: (obstacleSeq += 1),
            kind: template.kind,
            icon: template.icon,
            high: template.high,
            x: 1.08,
            passed: false
          });
        }
        for (const obstacle of runner.obstacles) {
          obstacle.x -= 0.03;
          if (obstacle.x < 0.05 && !obstacle.passed) {
            obstacle.passed = true;
            runner.tutorial.step += 1;
            spawnCooldown = 8;
            if (runner.tutorial.step >= 2) {
              runner.tutorial.active = false;
              tutorialDone = true;
            }
          }
        }
        runner.obstacles = runner.obstacles.filter((obstacle) => obstacle.x > -0.12);
        return;
      }
      runner.score += runner.pose === "duck" ? 2 : 1;
      runner.speed = 1 + Math.min(1.8, Math.floor(runner.score / 120) * 0.2);

      spawnCooldown -= 1;
      if (spawnCooldown <= 0) {
        spawnObstacle();
        spawnCooldown = Math.round((22 + Math.random() * 16) / runner.speed);
      }

      const step = 0.042 * runner.speed;
      for (const obstacle of runner.obstacles) {
        obstacle.x -= step;
        // 玩家固定在跑道左侧约 14% 处，障碍进入判定带时检查姿势
        const inHitZone = obstacle.x <= 0.2 && obstacle.x >= 0.08;
        if (inHitZone && !obstacle.passed) {
          const dodged = obstacle.high ? runner.pose === "duck" : runner.pose === "jump";
          if (!dodged) {
            runner.obstacle = obstacle.kind;
            crash();
            return;
          }
        }
        if (obstacle.x < 0.06 && !obstacle.passed) {
          obstacle.passed = true;
          runner.streak += 1;
          // 摸鱼连段：连续躲避只加表现分（影响结算倍率），不直接发爪币
          runner.score += 5 + Math.min(10, runner.streak);
        }
      }
      runner.obstacles = runner.obstacles.filter((obstacle) => obstacle.x > -0.12);
  }

  function crash() {
    runner.active = false;
    runner.crash = true;
    // 撞击冻结 250ms：先看定格画面，再出结算
    if (runnerTimer) window.clearInterval(runnerTimer);
    runnerTimer = undefined;
    window.setTimeout(() => settleCrash(), 250);
  }

  function settleCrash() {
    const isNewBest = runner.score > runner.best;
    runner.best = Math.max(runner.best, runner.score);
    state.pet.gameBest = runner.best;
    const reward = addPawCoins(Math.min(20, Math.floor(runner.score / 10)), "怨气闯关结算", "event", true);
    const bestLine = isNewBest ? "刷新最佳纪录！" : `最佳 ${runner.best}。`;
    runner.result = `被「${runner.obstacle}」撞飞，得分 ${runner.score}。${bestLine}${reward > 0 ? `奖励 +${reward} 爪币。` : ""}`;
    addPetLog("怨气闯关结算", `得分 ${runner.score}，${bestLine}${reward > 0 ? `奖励 +${reward} 爪币。` : ""}`);
    deps.onGameEnd?.();
  }

  /** 失焦/手动暂停：冻结计时器，保留现场 */
  function pauseRunner() {
    if (!runner.active || runner.paused) return;
    runner.paused = true;
    if (runnerTimer) window.clearInterval(runnerTimer);
    runnerTimer = undefined;
  }

  /** 恢复：由调用方完成 3-2-1 倒数后触发（计时器在 resume 内重建） */
  function resumeRunner() {
    if (!runner.active || !runner.paused) return;
    runner.paused = false;
    startTick();
  }

  function startTick() {
    if (runnerTimer) window.clearInterval(runnerTimer);
    runnerTimer = window.setInterval(tick, 90);
  }

  function runnerAction(action: "jump" | "duck") {
    if (!runner.active) startRunner();
    runner.pose = action;
    runner.score += action === "jump" ? 8 : 5;
    window.setTimeout(() => {
      if (runner.active && runner.pose === action) runner.pose = "run";
    }, action === "jump" ? 480 : 340);
  }

  function stopRunner(close = true) {
    runner.active = false;
    if (runner.score > 0 && !runner.crash) {
      const isNewBest = runner.score > runner.best;
      runner.best = Math.max(runner.best, runner.score);
      state.pet.gameBest = runner.best;
      const reward = addPawCoins(Math.min(20, Math.floor(runner.score / 10)), "怨气闯关结算", "event", true);
      const bestLine = isNewBest ? "刷新最佳纪录！" : `最佳 ${runner.best}。`;
      runner.result = `中途撤退，得分 ${runner.score}。${bestLine}${reward > 0 ? `奖励 +${reward} 爪币。` : ""}`;
      addPetLog("怨气闯关结算", `得分 ${runner.score}，${bestLine}`);
      deps.onGameEnd?.();
    }
    if (runnerTimer) window.clearInterval(runnerTimer);
    runnerTimer = undefined;
    if (close) runner.visible = false;
  }

  function disposeRunner() {
    if (runnerTimer) window.clearInterval(runnerTimer);
  }

  return { runner, startRunner, runnerAction, stopRunner, pauseRunner, resumeRunner, disposeRunner };
}
