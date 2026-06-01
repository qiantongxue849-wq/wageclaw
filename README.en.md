# 忍了吧 WageClaw

> Turn tedious work hours into a gamified, visual experience — every minute you endure becomes visible progress.

[![CI](https://github.com/YOUR_USERNAME/wageclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/wageclaw/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

English | [中文](./README.md)

---

## Demo

<!-- Place screenshots in design/ directory, then uncomment the lines below -->

<!-- ![Main UI](design/screenshot-main.png) -->
<!-- ![Pet](design/screenshot-pet.png) -->
<!-- ![Shop](design/screenshot-mall.png) -->

> **Try it**: `npm run dev` to start the dev server, then visit `http://localhost:5173`

<details>
<summary><strong>Click to view design assets</strong></summary>

```
Design mockups and prototypes are in the design/ directory:
├── garden-logistics-ui-v1.png     # UI design v1
├── garden-logistics-ui-v2.png     # UI design v2
├── supply-redesign-option-a.png   # Supply depot redesign A
├── supply-redesign-option-b.png   # Supply depot redesign B
├── supply-redesign-option-c.png   # Supply depot redesign C
└── icon-options/                  # Icon options
```

</details>

---

## Highlights

### Salary Per Second
Your monthly salary, broken down to the second. Watch your earnings tick up in real time — every moment of patience pays off.

### Rage Pet
A 10-stage evolution system, from "Resentment Mist" all the way to "Dark Jade Grudge Immortal." 5-stat training, touch interactions, alchemy, and a floating desktop companion.

### Supply Depot
Dual-currency shop (Endurance Credits + Rage) with 5 item categories. Wish fragments light up one by one, making savings goals tangible.

### Mini Games
Desk Duel (fighting), Gomoku (vs AI), Rage Runner (platformer) — three ways to decompress at work.

### AI Office Ninja
Enter your workplace problem. Get a three-stage response: emotional validation → goal anchoring → tactical advice. Auto-redacts sensitive info.

### Anonymous Treehole
Community feed for anonymous venting. Auto-detects and replaces private information before publishing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 41                           │
│  ┌──────────────┐  IPC   ┌──────────────────────────┐   │
│  │  main.cjs    │◄──────►│  preload.cjs (bridge)    │   │
│  │  Dual window │        └──────────┬───────────────┘   │
│  │  System tray │                   │                    │
│  │  Blackout    │                   ▼                    │
│  └──────────────┘        ┌──────────────────────────┐   │
│                          │     Vue 3 + TypeScript    │   │
│                          │  ┌────────┐ ┌─────────┐  │   │
│                          │  │App.vue │ │PetApp   │  │   │
│                          │  │Main UI │ │Float Pet│  │   │
│                          │  └───┬────┘ └────┬────┘  │   │
│                          │      │           │       │   │
│                          │      ▼           ▼       │   │
│                          │  ┌────────────────────┐  │   │
│                          │  │  useWageClaw.ts    │  │   │
│                          │  │  Core state + logic│  │   │
│                          │  └────────┬───────────┘  │   │
│                          │           │              │   │
│                          │           ▼              │   │
│                          │     localStorage         │   │
│                          └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Core Design

- **Single Composable Architecture**: `useWageClaw.ts` (~1215 lines) is the single source of truth for all state and business logic. Components are thin presentation layers.
- **Dual-Window Electron**: Main window (full app) + Pet window (floating, transparent, always-on-top), communicating via IPC.
- **7 Theme System**: cyber / dawn / smog / paper / mint / peach / sky, driven by CSS variables.
- **Triple Currency**: Endurance Credits (per-second accumulation), Rage (pet interactions), Paw Coins (attendance/events).

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/wageclaw.git
cd wageclaw

# Install
npm install

# Dev server with HMR
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build

# Run Electron desktop app
npm run electron
```

## Build & Package

```bash
# Windows installer (NSIS)
npm run dist:win

# macOS (dmg + zip)
npm run dist:mac
```

## Project Structure

```
wageclaw/
├── src/
│   ├── main.ts              # Entry: routes to main UI or pet based on ?view param
│   ├── App.vue              # Main app shell, all page templates
│   ├── PetApp.vue           # Floating pet window
│   ├── types.ts             # TypeScript type definitions
│   ├── styles.css           # Global styles + 7 themes
│   ├── composables/
│   │   └── useWageClaw.ts   # Core logic (state management + business calculations)
│   ├── components/
│   │   └── PetSprite.vue    # Pet SVG renderer
│   └── data/
│       └── catalog.ts       # Static data (evolution stages, items, themes)
├── electron/
│   ├── main.cjs             # Electron main process (windows, tray, IPC)
│   └── preload.cjs          # Context bridge
├── design/                  # UI design mockups
└── scripts/                 # Build scripts
```

## Documentation

- [Feature Docs](./PROJECT_DOCS.md) — Complete feature module descriptions
- [Build Notes](./BUILD_NOTES.md) — Packaging and release guide
- [Changelog](./CHANGELOG.md) — Version history
- [Contributing](./CONTRIBUTING.md) — How to contribute

## Roadmap

- [ ] Real LLM API integration for the AI Ninja
- [ ] Online duel mode (WebSocket rooms)
- [ ] Mobile adaptation with voice input
- [ ] Statistics dashboard and data export
- [ ] Account system and cloud sync

## License

[MIT](./LICENSE)
