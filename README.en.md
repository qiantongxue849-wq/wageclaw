# 忍了吧 WageClaw

Turn tedious work hours into a gamified, visual experience — every minute you endure becomes visible progress.

![version](https://img.shields.io/badge/version-0.3.0-blue)

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Vue 3 + TypeScript |
| Build | Vite 7 |
| Desktop | Electron 41 + electron-builder |
| Storage | localStorage (key: `wageclaw-state-v3`) |

## Quick Start

```bash
# Install dependencies
npm install

# Dev server with HMR
npm run dev

# Type check
npm run typecheck

# Production build
npm run build

# Electron desktop
npm run electron

# macOS distribution
npm run dist:mac
```

## Core Features

### 🏦 Endurance Wallet
- **Salary per second**: Monthly salary divided by working days × workday seconds, accumulating in real time
- **Dynamic claims**: Claim your earned amount anytime — balance resets and starts accumulating again
- **Privacy mode**: Toggle in Settings → Appearance to hide all balance figures as `¥****`
- **Wish fragments**: Break down wish gifts into purchasable fragments with progress tracking
- **Transaction log**: Multi-category filtering, monthly stats, paginated history

### 🛒 Supply Depot
- **Shop**: Items across 5 categories with dual currency (wallet + rage)
- **Inventory + Usage log**: Unified card layout with sub-tabs, matches the shop exactly
- **Filter & paginate**: Filter by category, 10 items per page

### 👾 Rage Pet
- **10 evolution stages**: From mist sprite to immortal entity, each with unique visuals and dialogue
- **5 stats**: Rage, Light, Mana, Satiety, Affection — all trainable
- **Touch interactions**: 5 touch zones with unique reactions and stat bonuses
- **Alchemy & feeding**: Refine frustrations into rage/light, feed offerings from inventory

### 🎮 Mini Games
- **Desk duel**: Fighting game with WASD + JKIL + Shift controls
- **Gomoku**: 15×15 board vs AI, win/loss tracking
- **Rage runner**: Side-scrolling obstacle dodge with score tracking

### 🥷 AI Office Ninja
- Three-stage response: emotional validation → goal anchoring → tactical advice
- Three mood modes with context-aware generation
- Auto-redaction of names, companies, and locations

### 🌳 Anonymous Treehole
- Community feed with sample stories
- Safe publishing with automatic sensitive-info redaction

### ⏱ Countdown Sync
- Off-work / Saturday / Payday triple countdown
- Natural day / working day modes
- Morning / evening / follow-up push messages

### ⚙ Settings
- Profile: nickname, salary, wish, target price
- Schedule: work hours, payday
- 7 themes: cyber, dawn, smog, paper, mint, peach, sky
- Data management: localStorage V3 with full reset

## Project Structure

```
src/
├── App.vue                    # Main component, all page templates
├── main.ts                    # Vue 3 entry point
├── styles.css                 # Global styles (~2777 lines)
├── types.ts                   # TypeScript type definitions
├── components/
│   └── PetSprite.vue          # Pet SVG component (compact/hero/mini)
├── composables/
│   └── useWageClaw.ts         # Core logic (~1215 lines)
└── data/
    └── catalog.ts             # Static data (pet stages, items, themes)
electron/
├── main.cjs                   # Electron main process
└── preload.cjs                # Preload script with contextBridge
```

## Roadmap

1. Real LLM API integration for the AI Ninja
2. Online duel mode (WebSocket)
3. Mobile adaptation with voice input
4. Statistics dashboard and export
5. Cloud sync and account system
