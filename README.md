# 忍了吧 WageClaw

> 将枯燥的打工时间转化为可视化的游戏化体验 —— 让每一分钟硬扛，都变成看得见的进度。

[![CI](https://github.com/YOUR_USERNAME/wageclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/wageclaw/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

[English](./README.en.md) | 中文

---

## 演示

<!-- 请将截图放在 design/ 目录下，然后取消注释以下行 -->

<!-- ![主界面](design/screenshot-main.png) -->
<!-- ![桌宠](design/screenshot-pet.png) -->
<!-- ![商城](design/screenshot-mall.png) -->

> **运行演示**：`npm run dev` 启动开发服务器，访问 `http://localhost:5173`

<details>
<summary><strong>点击查看功能截图目录</strong></summary>

```
设计稿和原型文件位于 design/ 目录：
├── garden-logistics-ui-v1.png     # UI 设计稿 v1
├── garden-logistics-ui-v2.png     # UI 设计稿 v2
├── supply-redesign-option-a.png   # 补给仓重设计方案 A
├── supply-redesign-option-b.png   # 补给仓重设计方案 B
├── supply-redesign-option-c.png   # 补给仓重设计方案 C
└── icon-options/                  # 图标方案
```

</details>

---

## 功能亮点

### 按秒发薪
月薪按工作日和上下班时间折算为每秒收入，实时跳动累计。每一分忍耐都有回报。

### 怨气桌宠
10 阶进化系统，从「怨息雾团」一路养成到「玄怨邪仙」。5 维属性培养、触摸互动、炼化投喂，还有桌面悬浮小宠陪伴。

### 情绪补给仓
双货币商城（忍耐额度 + 怨气），道具分 5 大类。心愿碎片逐个点亮，让存钱目标变得具体可感。

### 内置小游戏
桌面对练（格斗）、五子棋（AI 对弈）、怨气闯关（跑酷）—— 工间解压三件套。

### AI 职场忍者
输入职场问题，生成三段式回复：情绪确认 → 目标锚定 → 战术指导。自动脱敏，安全发布。

### 匿名树洞
社区信息流，匿名吐槽，发布前自动检测替换隐私信息。

---

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 41                           │
│  ┌──────────────┐  IPC   ┌──────────────────────────┐   │
│  │  main.cjs    │◄──────►│  preload.cjs (bridge)    │   │
│  │  双窗口管理   │        └──────────┬───────────────┘   │
│  │  系统托盘    │                   │                    │
│  │  黑屏结界    │                   ▼                    │
│  └──────────────┘        ┌──────────────────────────┐   │
│                          │     Vue 3 + TypeScript    │   │
│                          │  ┌────────┐ ┌─────────┐  │   │
│                          │  │App.vue │ │PetApp   │  │   │
│                          │  │主界面   │ │桌面悬浮宠│  │   │
│                          │  └───┬────┘ └────┬────┘  │   │
│                          │      │           │       │   │
│                          │      ▼           ▼       │   │
│                          │  ┌────────────────────┐  │   │
│                          │  │  useWageClaw.ts    │  │   │
│                          │  │  核心状态 + 业务逻辑 │  │   │
│                          │  └────────┬───────────┘  │   │
│                          │           │              │   │
│                          │           ▼              │   │
│                          │     localStorage         │   │
│                          └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心设计

- **单 Composable 架构**：`useWageClaw.ts`（~1215 行）是全部状态和业务逻辑的唯一来源，组件层仅负责展示
- **双窗口 Electron**：主窗口（完整界面）+ 桌宠窗口（悬浮透明），通过 IPC 实时通信
- **7 套主题**：cyber / dawn / smog / paper / mint / peach / sky，CSS 变量驱动
- **三货币体系**：忍耐额度（按秒累积）、怨气（桌宠互动）、爪币（签到/事件）

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/wageclaw.git
cd wageclaw

# 安装依赖
npm install

# 启动开发服务器（HMR 热更新）
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 生产构建
npm run build

# 运行 Electron 桌面端
npm run electron
```

## 打包发布

```bash
# Windows 安装包 (NSIS)
npm run dist:win

# macOS (dmg + zip)
npm run dist:mac
```

## 项目结构

```
wageclaw/
├── src/
│   ├── main.ts              # 入口：根据 ?view 参数路由到主界面或桌宠
│   ├── App.vue              # 主界面 shell，所有页面模板
│   ├── PetApp.vue           # 桌宠悬浮窗口
│   ├── types.ts             # TypeScript 类型定义
│   ├── styles.css           # 全局样式 + 7 套主题
│   ├── composables/
│   │   └── useWageClaw.ts   # 核心逻辑（状态管理 + 业务计算）
│   ├── components/
│   │   └── PetSprite.vue    # 桌宠 SVG 渲染器
│   └── data/
│       └── catalog.ts       # 静态数据（进化阶段、商品、主题）
├── electron/
│   ├── main.cjs             # Electron 主进程（窗口、托盘、IPC）
│   └── preload.cjs          # 上下文桥接
├── design/                  # UI 设计稿和原型
└── scripts/                 # 构建脚本
```

## 文档

- [功能详解](./PROJECT_DOCS.md) — 完整功能模块说明
- [构建说明](./BUILD_NOTES.md) — 打包和发布指南
- [更新日志](./CHANGELOG.md) — 版本历史
- [贡献指南](./CONTRIBUTING.md) — 如何参与贡献

## 路线图

- [ ] 接入真实 LLM API 驱动 AI 忍者回复
- [ ] 联机对练（WebSocket 房间）
- [ ] 移动端适配与语音对话
- [ ] 数据统计图表与导出
- [ ] 账号体系与云端同步

## 许可证

[MIT](./LICENSE)
