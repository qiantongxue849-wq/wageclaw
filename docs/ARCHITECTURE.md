# WageClaw 架构指南（2026-08 重构后）

> 面向后续维护者与功能扩展者。配合 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 阅读可了解本轮优化的来龙去脉。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3.5 + TypeScript 5.9（strict） | 组合式 API，`noUnusedLocals` 开启 |
| 构建 | Vite 7 | `npm run build`，产物 `dist/` |
| 桌面端 | Electron 41 + electron-builder | 双窗口：主窗口 `?view=main` / 悬浮桌宠 `?view=float` |
| 测试 | Vitest 4 | `npm run test`，纯逻辑单测位于 `tests/` |
| Lint | ESLint 9（flat config） | `npm run lint`；只管正确性不管格式，`vue/no-mutating-props` 已关闭（wc 是共享 store 模式） |
| 存储 | localStorage | 每用户隔离，key `wageclaw-state-v3` |

## 一键体检

```bash
npm run check   # lint + typecheck + vitest + build 四连，任何一步失败即退出
```

提交时 husky 钩子（`.husky/pre-commit`）自动跑 lint + typecheck + test。

## Electron 主进程结构

```
electron/
├── main.cjs          # 入口：生命周期、单实例锁、ctx 组装、启动编排（~150 行）
├── app-windows.cjs   # 主窗口/悬浮窗/黑屏结界创建 + 渲染加载
├── app-tray.cjs      # 托盘菜单与 Dock 可见性
├── pet-motion.cjs    # 桌宠桌面演出（弹跳/风暴/核爆定时器）
├── app-shell.cjs     # 认证后外壳启停 + 受控退出
├── app-ipc.cjs       # 全部 IPC 通道（入参校验/夹取，send 通道校验 event.sender）
├── preload.cjs       # contextBridge 白名单 API
└── services/         # auth-service（Supabase + 本地测试档）与 update-service
```

模块协作用共享上下文 `ctx`（同时存放窗口引用）。`wageclaw:focus-screen` 走四屏 allowlist；
`pet-resize` 尺寸夹取；备份导出走原生保存对话框（`wageclaw:export-backup`）。
已知接受的风险：`WAGECLAW_LOCAL_TEST_AUTH` / 外部 app-config.json 可在打包版开启本地测试登录，
仅影响本机数据、无服务端提权，保留作为 QA 通道。

## 目录地图

```
src/
├── main.ts                     # 入口：按 view 参数分流 AuthApp / PetApp / App
├── App.vue                     # 主壳：导航、顶栏、onboarding、悬浮宠物、弹窗挂载（~610 行）
├── PetApp.vue                  # 悬浮桌宠窗口壳
├── components/
│   ├── screens/                # ❌ 未采用该目录；屏幕组件直接平铺在 components/ 下
│   ├── ConverterScreen.vue     # 首页（薪资/心愿拆分台/每日任务卡）
│   ├── MallScreen.vue          # 补给仓（心愿商城/供销社/背包）
│   ├── PetScreen.vue           # 桌宠页（属性/炼化/投喂/游戏入口/成就殿堂）
│   ├── SettingsScreen.vue      # 设置页（账号/资料/外观/提示/数据）
│   ├── GameModals.vue          # 游戏路由：按可见性挂载三款游戏壳层
│   ├── games/
│   │   ├── GameShell.vue       # 统一游戏壳层（顶栏/退出确认/Esc）
│   │   ├── GameLobby.vue       # 解压游戏厅入口模块（桌宠页内嵌）
│   │   ├── GameResultCard.vue  # 统一结算卡
│   │   ├── GameHud.vue         # 舞台内 HUD 胶囊
│   │   └── DuelGame/GomokuGame/RunnerGame.vue
│   ├── RealizedDialog.vue      # 已实现心愿陈列弹窗
│   ├── PetSprite.vue           # 桌宠精灵图渲染（网格帧动画）
│   └── PetSpriteLight.vue      # 低功耗版渲染
├── composables/
│   ├── useWageClaw.ts          # 组装层/门面：reactive store + 全部动作方法（对外唯一 store）
│   ├── usePetRuntime.ts        # 悬浮窗桌宠的独立运行时（bridge 命令）
│   ├── useAccountAndUpdates.ts # 登录会话与更新器
│   ├── useHomePetSupply.ts     # 首页/桌宠页共用的快速照料面板
│   ├── games.ts                # 三个小游戏的引擎（依赖注入式工厂；逻辑+fx 状态，DOM 在 games/ 组件）
│   ├── petDailyGrowth.ts       # 每日成长值上限/广播增长（纯逻辑）
│   └── petAscension.ts         # 飞升视图计算
├── state/                      # 存档与调参（全部纯模块）
│   ├── tuning.ts               # 全局调参常量（节流/衰减/血压边界/默认作息）
│   ├── defaults.ts             # 默认提示词 + createDefaultState/createFirstRunState
│   ├── sanitize.ts             # 任意来源存档 → 合法 WageClawState（含旧档迁移）
│   ├── persistence.ts          # STORAGE_KEY / loadState（localStorage 读写入口）
│   ├── paw-ledger.ts           # 爪币日/月账本工厂与归一化
│   └── session-types.ts        # 视图会话内部类型（PageKey 等）
├── utils/                      # 与 Vue 无关的纯函数
│   ├── core.ts                 # clamp/日期键/转义等通用工具
│   ├── salary.ts               # 发薪日与薪资周期
│   ├── vitals.ts               # 血压与触摸热度数值规则
│   ├── countdown.ts            # 下班/周六/发薪/节假日倒计时
├── data/                       # 静态内容注册表（新增内容只改这里）
│   ├── catalog.ts              # 桶文件：兼容旧导入路径 @/data/catalog
│   ├── wishes.ts  pets.ts  items.ts  events.ts  labels.ts
│   ├── visuals.ts              # 心愿/补给/投喂图片注册表
│   ├── achievements.ts         # 成就殿堂（数据 + 判定函数）
│   ├── quests.ts               # 每日任务池 + 按日期确定性抽取
│   ├── profile-avatars.ts      # 主题档案头像
│   └── pet-style-previews.ts   # 桌宠风格预览卡
└── styles/
    └── motion.css              # 统一动效层（在 styles.css 之后加载，允许覆盖）
```

## 核心数据流

```
localStorage ──loadState()──▶ sanitizeState() ──▶ reactive<WageClawState>(useWageClaw())
                                                        │
                     App.vue: const wc = reactive(useWageClaw())
                                                        │ props 注入（WageClawStore 类型）
                     ConverterScreen / MallScreen / PetScreen / SettingsScreen / GameModals
                                                        │
                     动作方法（claimDailyWallet/buyMallItem/trackQuest…）改 state
                                                        │
                     scheduleStateSave() 4s 节流 ──▶ localStorage
```

- `WageClawStore = UnwrapNestedRefs<ReturnType<typeof useWageClaw>>`：屏幕组件的 `wc` prop 类型，与模板访问语义一致（ref 已解包）。
- 悬浮桌宠窗口运行独立的 `usePetRuntime`，与主窗口通过 Electron IPC（`wageclaw:pet-command` 等通道）同步命令。

## 存档兼容原则

1. 任何新字段：在 `state/defaults.ts` 的 `createDefaultState()` 给默认值，并在 `state/sanitize.ts` 做归一化（缺省补齐、非法回退、旧值迁移）。
2. 旧档迁移示例：`hunger→satiety`、`09:30/18:30→08:30/18:00`、iphone16 碎片迁移、爪币从怨气余额兜底——参考 `sanitize.ts` 既有写法。
3. **测试守门**：存档迁移行为由 `tests/sanitize.test.ts` 锁定，改 sanitize 前先跑 `npm run test`。

## 扩展指南

### 新增商城商品 / 心愿 / 桌宠风格 / 工作事件
改 `src/data/items.ts` / `wishes.ts` / `pets.ts` / `events.ts`，对应图片放进 `src/data/visuals.ts` 注册表。业务代码零改动。

### 新增成就
在 `src/data/achievements.ts` 加一条 `{ id, name, description, icon, category, reward, target, value }`。
`value` 从存档可推导字段读取（不要加新计数器）；引擎每秒自动判定，解锁即弹 toast + 发爪币 + 记桌宠日志。

### 新增每日任务
在 `src/data/quests.ts` 的 `questPool` 加一条，选择任务要累计的 `metric`；
若需要新 metric：在 `QuestMetric` 联合类型加值，并在 `useWageClaw.ts` 对应动作处调 `trackQuest("新metric")`。

### 新增屏幕
1. 建 `src/components/XxxScreen.vue`，`defineProps<{ wc: WageClawStore }>()`；
2. `App.vue` 中用 `v-show="wc.activeScreen === 'xxx'"` 挂载；
3. `ScreenKey`（types.ts）与 `screenTitles`/`navItems`/`navIconMap`（labels.ts / App.vue）同步加值。

### 图片体积
新图片走 `scripts/optimize-images.mjs` 管线（`node scripts/optimize-images.mjs --dry-run` 先看计划）。
`toWebp` 模式会改文件后缀，记得同步更新 `visuals.ts` 等导入。

## 已知取舍

- `src/styles.css`（~15000 行）保持单一级联源：文件内无语义分节，任意切分会破坏覆盖顺序；动效层已示范拆到 `src/styles/motion.css`，后续新增样式建议按「层」追加新文件而不是继续膨胀单文件。
- `useWageClaw.ts`（~2200 行）是刻意保留的组装层：纯逻辑已下沉到 `state/`、`utils/`、`games.ts`、`countdown.ts`；进一步拆分建议以 R5 的单测为安全网逐域进行。
- `ninja/community/sync` 三个 ScreenKey 为历史遗留（导航不展示），清理时需同步清理 `pageLabels`、`screenMoodLine` 与 IPC 的 screen 白名单。
