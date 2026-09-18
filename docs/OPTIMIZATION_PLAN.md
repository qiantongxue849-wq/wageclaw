> 历史文档：以下描述属于轻量化改造前的版本。当前功能与架构以 README.md 和 docs/ARCHITECTURE.md 为准。

# WageClaw 系统性优化规划（2026-08）

> 目标：把「忍了吧 WageClaw」按成熟桌面产品的标准做一轮全面优化，覆盖**轻量化、可玩性、升级维护、可延展性**四个维度。规划分 7 轮执行，每轮结束用 typecheck/build 验证，最后用实机 QA 收口。

## 0. 现状诊断（基线）

| 维度 | 现状 | 问题 |
|------|------|------|
| 代码规模 | ~11k 行 TS/Vue + 15150 行 styles.css | `useWageClaw.ts` 3164 行、`App.vue` 2675 行、`catalog.ts` 1417 行，均为巨型文件 |
| 资产 | src/assets 23MB | 桌宠动作 webp 单张 0.6~1MB（已压一轮）；wishlist PNG 6.2MB |
| 工程化 | 仅 typecheck | 无测试、无 lint、无统一 check 入口 |
| 文档 | PROJECT_DOCS.md (5月) | 数据严重过时（称 App.vue 842 行，实际 2675 行） |
| 可玩性 | 桌宠养成 + 2 小游戏 + 记账/商城 | 缺少中长期目标感（成就、日常任务） |
| 健康度 | vue-tsc 通过 | 工作区存在大量未提交改动（上一轮资产压缩），本轮不碰 git，逐文件增量修改 |

## 1. 分轮规划

### R1 轻量 · 资产与加载
- [x] 建立基线：dist 体积、资产分目录体积、代码行数
- [ ] 深化 `scripts/optimize-images.mjs`：pet-actions 再压（q50→q42、帧高 192→176）、wishlist PNG 调色板量化强化
- [ ] 审计资产引用方式：确认非当前桌宠的精灵图不会随首屏加载（按需 import / 动态加载）
- [ ] 验证：`npm run build` 前后 dist/assets 体积对比，产物可运行

### R2 数据层 · catalog 拆分（可延展性）
- [ ] `catalog.ts` → `src/data/` 下按领域拆分：`pets.ts`（桌宠阶段/触摸）、`items.ts`（商城道具）、`wishes.ts`（心愿/碎片）、`events.ts`（工作事件/里程碑）、`labels.ts`（主题/标题/文案）、`index.ts` 统一出口
- [ ] 保持对外导入路径兼容（`@/data/catalog` 重导出），业务代码零改动
- [ ] 新增内容只需加数据文件 —— 可延展性的直接体现

### R3 逻辑层 · useWageClaw 拆分（维护性核心）
- [ ] 纯函数/常量层下沉：`createDefaultState`/`sanitizeState`/`loadState` → `src/state/persistence.ts`
- [ ] 按领域抽子 composable：薪资/钱包、怨气事件、桌宠运行时（已有 usePetRuntime）、商城/背包、账本、健康提醒
- [ ] `useWageClaw` 保留为组装层（门面），对外 API 不变
- [ ] 每拆一块跑一次 `npm run typecheck`，绿了再拆下一块

### R4 视图层 · App.vue 与样式拆分
- [ ] App.vue 模板按 screen 拆为 `src/components/screens/*.vue`（converter/mall/pet/ninja/community/sync/settings + onboarding + 更新弹窗）
- [ ] 组件通过 props 接收 `wc` 门面对象，不改逻辑，纯搬运 + typecheck 验证
- [ ] `styles.css` 按屏幕/组件拆为 `src/styles/*.css` 模块，入口聚合（Vite 合包，运行时体积不变）
- [ ] 目标：App.vue < 500 行，styles 单文件 < 500 行

### R5 工程化 · 测试与检查
- [ ] 引入 Vitest + 单测：薪资折算/状态 sanitize/成就判定/账本分页等纯逻辑
- [ ] `npm run check` = typecheck + test + build 一键体检
- [ ] 视情况补 ESLint（若依赖安装顺利）

### R6 可玩性 · 成就系统 + 每日任务（数据驱动）
- [ ] `src/data/achievements.ts`：~24 个成就（薪资/怨气/桌宠/小游戏/商城五大类），判定函数纯数据驱动
- [ ] `src/data/quests.ts`：每日任务池 + 每日随机 3 个 + 爪币奖励
- [ ] UI：成就殿堂入口（设置页或独立 tab）+ 解锁 toast + 任务卡片
- [ ] 状态迁移：`sanitizeState` 兼容旧存档（缺字段补默认值）

### R7 收尾 · 文档与终检
- [ ] 新增 `docs/ARCHITECTURE.md`（模块地图 + 扩展指南）；更新 README/PROJECT_DOCS 数据
- [ ] 终检：`npm run check` 全绿 + `node scripts/qa-electron.cjs` 实机走查 + 最终体积报告

## 2. 执行原则
1. **不改对外行为**：所有拆分先保 API 兼容，typecheck+build 双绿才算完成一步
2. **不碰 git**：工作区已有未提交改动，全部在现有工作树上增量修改
3. **数据驱动优先**：新内容（成就/任务/事件）全部落在 `src/data/`，代码只写引擎
4. **用户可见文案全部中文**

---

## 3. 执行结果（2026-08-29 完盘）

| 轮次 | 结果 | 关键证据 |
|------|------|----------|
| R1 轻量 | ✅ src/assets 20.7MB→13.2MB（-36%），dist 22MB→16MB | wishlist/pet-stages 转 webp q85、settings-icons 降采样；管线升级进 `optimize-images.mjs`（含 toWebp 幂等模式）；pet-actions 实测已到压缩地板（q42 仅再省 6%），保持 q50 |
| R2 数据层 | ✅ catalog.ts 1417 行 → 5 个领域模块 + 9 行桶文件 | `data/{wishes,pets,items,events,labels}.ts`，`@/data/catalog` 兼容导出 |
| R3 逻辑层 | ✅ useWageClaw.ts 3164→2199 行 | 纯逻辑下沉 `state/`（tuning/defaults/sanitize/persistence/paw-ledger/session-types）+ `utils/`（core/salary/vitals/countdown）+ `games.ts`（依赖注入式游戏工厂） |
| R4 视图层 | ✅ App.vue 2675→610 行 | 四屏组件（Converter/Mall/Pet/Settings）+ GameModals/RealizedDialog；共享注册表 visuals/profile-avatars/pet-style-previews；**删除 289 行 v-if="false" 死模板**；styles.css 抽出 111 行动效层 → `styles/motion.css` |
| R5 工程化 | ✅ Vitest 48 测全绿 | `tests/` 六组单测锁存档迁移/数值规则/倒计时/任务引擎；`npm run check` = typecheck+test+build |
| R6 可玩性 | ✅ 24 成就 + 11 任务池（每日确定性抽 3） | 数据驱动：`data/achievements.ts`、`data/quests.ts`；引擎每秒判定、解锁发爪币+toast；首页任务卡 + 桌宠页成就殿堂；实机截图验证 |
| R7 收尾 | ✅ | `docs/ARCHITECTURE.md`（模块地图+扩展指南）、README 刷新、PROJECT_DOCS 标记历史 |

**未做与理由（诚实清单）**：
- styles.css 全量语义拆分：15150 行无分节标记，任意切点只破坏覆盖顺序、无维护收益；已用 motion.css 示范「按层追加」模式，结论写入 ARCHITECTURE.md。
- useWageClaw 函数体（2199 行）保留为组装层：剩余为高耦合的响应式动作方法，进一步拆分以新单测为安全网逐域进行，本轮不冒进。
- pet-actions 精灵图未再压：q42 实测仅再省 ~6%，画质风险不值。

**终检**：`npm run check` 全绿 + `scripts/qa-electron.cjs` 实机走查（登录→主界面→桌宠→格斗结算）通过。
