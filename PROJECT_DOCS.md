# ⚠️ 历史文档（2026-05 版本，数据已过时）

> 最新架构与扩展指南请看 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)；
> 本轮优化记录见 [docs/OPTIMIZATION_PLAN.md](./docs/OPTIMIZATION_PLAN.md)。

# 忍了吧 WageClaw - 项目功能文档

## 一、项目概述

**忍了吧 WageClaw** 是一款面向职场打工人的桌面陪伴应用，通过"按秒发薪"、"怨气桌宠"、"AI 职场忍者"等创新概念，将枯燥的工作时间转化为可视化的游戏化体验。

### 核心定位
- **时间可视化**：月薪按秒折算，今日可领数额实时跳动，让忍耐有进度感
- **情绪出口**：把职场糟心事转化为可量化的"怨气"和"忍耐额度"
- **目标激励**：心愿碎片点亮机制，让存钱目标具体可感
- **桌面陪伴**：10 阶进化桌宠 + 内置小游戏，提供情绪价值和轻度娱乐
- **实用工具**：倒计时、记账、AI 建议等职场辅助功能

---

## 二、技术架构

### 2.1 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3.5 + TypeScript 5.9 | SFC 组件 + Composables 组合式 API |
| 构建工具 | Vite 7 | 开发服务器 + HMR + 生产构建 |
| 桌面端 | Electron 41.2 | 主窗口 + 桌宠窗口双窗口架构 |
| 数据存储 | localStorage | 本地持久化，key 为 `wageclaw-state-v3` |
| 类型检查 | vue-tsc 3.1 | 模板类型推导 + TS 严格模式 |

### 2.2 文件结构
```
src/
├── App.vue                    # 主组件 (~842 行)，全部页面模板
├── main.ts                    # Vue 3 createApp 入口
├── styles.css                 # 全局样式 (~2777 行)
├── types.ts                   # TypeScript 类型定义 (142 行)
├── vite-env.d.ts              # Vite 客户端类型声明
├── components/
│   └── PetSprite.vue          # 桌宠 SVG 组件，支持 compact/hero/mini 三种模式
├── composables/
│   └── useWageClaw.ts         # 核心逻辑 (~1215 行)，组合式 API
└── data/
    └── catalog.ts             # 静态数据（桌宠阶段、道具、主题标签、示例故事等）
electron/
├── main.cjs                   # Electron 主进程，窗口管理 + IPC 通信
└── preload.cjs                # 预加载脚本，contextBridge 暴露安全 API
```

---

## 三、核心数据模型

```typescript
type WageClawState = {
  nickname: string          // 用户称呼
  salary: number            // 月薪
  wish: string              // 心愿礼物
  price: number             // 心愿总价
  rageMinutes: number       // 今日被折磨分钟
  mood: Mood                // 情绪状态 (rage/stable/numb)
  theme: Theme              // 主题 (7 套)
  countMode: CountMode      // 倒计时口径 (natural/workday)
  startTime: string         // 上班时间 (HH:MM)
  endTime: string           // 下班时间 (HH:MM)
  payday: number            // 发薪日
  walletBalance: number     // 已领取的忍耐余额
  rageBalance: number       // 怨气值
  lastClaimTime: string     // 上次领取的时间戳
  privacyMode: boolean      // 薪资隐私开关
  unlockedParts: string[]   // 已点亮碎片 ID
  inventory: Record<string, number>  // 背包 {itemId: count}
  pet: PetState             // 桌宠完整状态
  transactions: Transaction[]  // 交易记录
  usageLog: UsageLogItem[]  // 物品使用日志
  petLog: PetLogItem[]      // 桌宠事件日志
}
```

---

## 四、功能模块详解

### 4.1 忍耐账户

#### 4.1.1 按秒发薪系统
- **分子公式**：`secondSalary = 月薪 / (本月工作日 × 每天工作秒数)`
- **累积公式**：`claimableToday = 已过秒数 × secondSalary`（从上班时间或上次领取时间起算）
- **实时更新**：`now` ref 每秒刷新 → `claimableToday` computed 自动重算
- **精度**：浮点计算，精确到 ¥0.01

#### 4.1.2 动态领取
- "今日可领"每秒自动增长，点"领取"将当前累计金额入账
- 领取后记录时间戳，新一轮从领取时间继续累计
- 消费时若余额不足自动触发领取 → 不够再提示

#### 4.1.3 薪资隐私
- 设置 → 外观 → 薪资隐私开关
- 开启后所有余额展示替换为 `¥****`
- 实现：`formatBalance()` 函数根据 `state.privacyMode` 分流

#### 4.1.4 心愿碎片
- 心愿总价按碎片比例（trackpad 14%、ram 20%、shell 28%、screen 38%）拆分
- 用忍耐额度逐个购买点亮，每个碎片有独特叙事文案
- 全部点亮即心愿达成

#### 4.1.5 记账系统
- 5 大类：income / expense / wish / mall / pet
- 筛选查看 + 分页（每页 10 条）+ 月度统计

---

### 4.2 情绪补给仓

#### 4.2.1 商城货架
- 商品按 5 类标签分类：即时止损 / 回血 / 反打扰 / 保命预案 / 大额奖励
- 双货币购买：walker（忍耐额度）和 rage（怨气）
- 3 列卡片网格布局 + 分类筛选 + 分页

#### 4.2.2 背包 + 使用记录
- 单个面板 + 子标签切换（物品 / 最近使用）
- 背包物品：统一卡片布局，显示图标、名称、效果、数量、使用按钮
- 最近使用：卡片布局，显示图标、名称、效果时间
- 与商城货架完全一致的卡片样式

---

### 4.3 怨气桌宠

#### 4.3.1 10 阶进化系统
| 阶段 | 等级 | 名称 | 怨气阈值 |
|------|------|------|----------|
| 1 | Lv.1 | 怨息雾团 | 0 |
| 2 | Lv.2 | 电缆窥怨灵 | 80 |
| 3 | Lv.3 | 便签角灵 | 180 |
| 4 | Lv.4 | 键甲护怨使 | 320 |
| 5 | Lv.5 | 工位怨王 | 520 |
| 6 | Lv.6 | 会议碎阵师 | 760 |
| 7 | Lv.7 | 墨怨法相 | 1050 |
| 8 | Lv.8 | 绩雷邪灵 | 1380 |
| 9 | Lv.9 | 玄玉怨尊 | 1760 |
| 10 | Lv.10 | 玄怨邪仙 | 2200 |

每阶有独立形象描述、专属台词、独特色板（body/belly/accent/glow/eye/shadow）。

#### 4.3.2 属性系统
| 属性 | 说明 | 作用 |
|------|------|------|
| 怨气 (rage) | 核心成长能量 | 决定阶段和攻击力 |
| 灵力 (light) | 净化平衡能量 | 影响亲和度和防御 |
| 法力 (mana) | 技能施放资源 | 斗技等消耗 |
| 饱食 (satiety) | 饥饿程度 | 影响战斗表现 |
| 亲密 (affection) | 好感度 | 影响互动反馈 |

另有 attackBonus / defenseBonus / manaBonus / critBonus 四项永久强化。

#### 4.3.3 互动系统
- 5 种触摸：摸头 / 戳脸 / 揉肚 / 捏角 / 拽尾
- 每种触摸有专属 mood 和台词反馈，增加不同量怨气
- 召唤桌面悬浮形态 + 全屏养成面板双模式

#### 4.3.4 炼化与投喂
- 糟心事文本输入 → 炼化为怨气或灵力
- 供品分 4 类：怨气 / 灵力 / 永久强化 / 法力成长
- 从背包选择投喂，不同供品增加不同属性

---

### 4.4 内置小游戏

#### 4.4.1 桌面对练
- 模态弹窗格斗，WASD 移动 + JKIL 招式 + Shift 格挡 + QE 闪身
- 4 个主动招式 + 格挡反击 + 连招系统
- 体力条 / 能量条 / 敌我 HP 双血条

#### 4.4.2 五子棋
- 15×15 棋盘，玩家 vs AI
- 胜/负/平统计，可重开

#### 4.4.3 怨气闯关
- 横向跑酷，躲避障碍物（会议等）
- 跳跃/下蹲操作，计分 + 最佳纪录

---

### 4.5 AI 职场忍者
- 情绪状态选择（火大 / 稳如老狗 / 已经麻了）
- 输入职场问题 → 生成三段式回复：情绪确认 → 目标锚定 → 战术指导
- 安全脱敏：自动替换人名/公司/地点

---

### 4.6 匿名树洞
- 社区信息流，示例故事展示
- 匿名投稿 + 安全过滤 + 反应标签（递纸巾/同款老板/赛博上香等）

---

### 4.7 倒计时同步
- 三重倒计时：距下班 / 距周六 / 距发薪日
- 早/中/晚三段推送文案
- 自然日 / 工作日两种口径

---

### 4.8 设置

#### 4.8.1 资料 (profile)
称呼、月薪、心愿礼物、目标价格、今日被折磨分钟

#### 4.8.2 外观 (appearance)
7 套主题切换 + 倒计时口径 + 薪资隐私开关

#### 4.8.3 时间 (schedule)
上班时间、下班时间、发薪日

#### 4.8.4 数据 (data)
localStorage 持久化 V3，支持一键重置全部数据

---

## 五、用户交互流程

### 5.1 首次使用
1. 进入设置 → 填写称呼、月薪、心愿礼物
2. 配置上下班时间和发薪日
3. 回到控制台 → 今日可领开始跳动
4. 召唤桌宠、浏览补给仓

### 5.2 日常使用
1. 侧边栏查看今日可领和情绪气压
2. 手动领取攒出的额度
3. 补给仓购买道具或投喂桌宠
4. 桌面对练/五子棋/闯关解压
5. 倒计时页面确认下班/周末/发薪时间

### 5.3 目标达成
1. 每日积累忍耐额度
2. 购买心愿碎片逐步点亮
3. 全部碎片点亮 → 心愿达成
4. 设置新目标重新开始

---

## 六、运行与构建

### 开发模式
```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run typecheck  # TypeScript 类型检查
```

### 生产构建
```bash
npm run build      # 输出到 dist/
npm run preview    # 预览构建产物
```

### Electron 桌面端
```bash
npm run electron                     # 开发模式运行桌面端
npm run dist:mac                     # macOS dmg + zip 打包
npm run dist:mac:dmg:localfix        # 仅 dmg
```

---

*文档版本：v2.0*
*更新日期：2026-05-07*
