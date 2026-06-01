# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WageClaw (忍了吧) is a gamified desktop companion app for office workers. It converts枯燥的工作时间 into visual, game-like progress — salary accumulates per-second, a "rage pet" evolves through 10 stages, and built-in mini-games provide stress relief.

## Tech Stack

- **Frontend**: Vue 3.5 + TypeScript 5.9 (Composition API, SFC)
- **Build**: Vite 7
- **Desktop**: Electron 41 + electron-builder
- **Storage**: localStorage (`wageclaw-state-v3` key)

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server with HMR at http://127.0.0.1:5173
npm run typecheck        # TypeScript type checking (vue-tsc --noEmit)
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all source files
npm run format:check     # Check formatting without modifying
npm test                 # Run unit tests (vitest run)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run build            # Production build → dist/
npm run preview          # Preview production build
npm run electron         # Run Electron desktop app
npm run dist:win         # Build Windows installer (NSIS)
npm run dist:mac         # Build macOS dmg + zip
npm run dist:linux       # Build Linux AppImage
```

## Architecture

### Dual-Window Electron Design

The app runs two Electron windows simultaneously:
- **Main window** (`mainWindow`): Full app with sidebar navigation, loaded via `?view=main`
- **Pet window** (`petWindow`): Floating always-on-top pet, loaded via `?view=float`, transparent frameless, skip-taskbar

The entry point `src/main.ts` bootstraps different Vue roots based on the `?view` query parameter — `App.vue` for the main panel, `PetApp.vue` for the floating pet.

### Source Layout

```
src/
├── main.ts              # Bootstrap: routes to App.vue or PetApp.vue based on ?view param
├── App.vue              # Main app shell — all page templates (~842 lines)
├── PetApp.vue           # Floating pet window component
├── types.ts             # All TypeScript type definitions (WageClawState, PetState, etc.)
├── styles.css           # Global styles (~2777 lines), 7 theme variants
├── pet.css              # Pet window styles
├── components/
│   └── PetSprite.vue    # SVG pet renderer (compact/hero/mini modes)
├── composables/
│   └── useWageClaw.ts   # Core logic composable (~1215 lines) — ALL state management lives here
└── data/
    └── catalog.ts       # Static data: pet evolution stages, mall items, themes, sample stories
```

### Key Patterns

- **Single composable architecture**: `useWageClaw.ts` is the brain — it owns all reactive state (`WageClawState`), computed derivations, and business logic. Components are thin presentation layers.
- **State persistence**: Entire state serialized to localStorage on changes (throttled to 4s). Key: `wageclaw-state-v3`.
- **IPC bridge**: Electron main↔renderer communication via `contextBridge` in `preload.cjs`. Pet window sends commands (drag, touch, ricochet/storm/nuke animations) to main process, which forwards to the main window.
- **Theme system**: 7 CSS themes (cyber, dawn, smog, paper, mint, peach, sky) applied via `data-theme` attribute on `<html>`.
- **Dual currency**: `wallet` (忍耐额度, earned per-second) and `rage` (怨气, from pet interactions/refining frustrations). `paw` (爪币) is a third currency from attendance/interactions.

### Electron Main Process

`electron/main.cjs` manages:
- Main window + pet window lifecycle and positioning
- System tray with toggle menu
- Pet animation commands (ricochet bounce, spiral storm, nuke chaos)
- Desktop blackout overlay (full-screen black with animated timer)
- IPC handlers for navigation, pet control, window management

## Data Flow

```
User action → useWageClaw.ts methods → reactive state updates →
  → Vue reactivity triggers re-render
  → localStorage save (throttled)
  → IPC to pet window (if needed)
```

## Testing

- **Framework**: Vitest with happy-dom environment
- **Test files**: `src/**/*.test.ts` (co-located with source)
- **Coverage**: `npm run test:coverage` — v8 provider, covers `src/**/*.{ts,vue}`
- **What to test**: Utility functions, state sanitization, data integrity, computed logic
- **Pattern**: Import pure functions directly, test with `describe/it/expect`

## Important Constants

- `STORAGE_KEY = "wageclaw-state-v3"` — localStorage key
- `PAGE_SIZE = 10`, `MALL_PAGE_SIZE = 9` — pagination sizes
- `STATE_SAVE_THROTTLE_MS = 4000` — localStorage write throttle
- Pet evolution thresholds: 0, 80, 180, 320, 520, 760, 1050, 1380, 1760, 2200 rage
