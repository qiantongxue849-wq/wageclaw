# Contributing to WageClaw

Thank you for your interest in contributing to WageClaw! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/wageclaw.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run type checking: `npm run typecheck`
4. Test your changes in both web (`npm run dev`) and Electron (`npm run electron`)
5. Commit with a clear message
6. Push and open a Pull Request

## Project Structure

- `src/App.vue` — Main app shell with all page templates
- `src/composables/useWageClaw.ts` — Core business logic and state management
- `src/data/catalog.ts` — Static data (pet stages, items, themes)
- `src/types.ts` — TypeScript type definitions
- `electron/main.cjs` — Electron main process
- `electron/preload.cjs` — Context bridge for IPC

## Code Guidelines

- Use Vue 3 Composition API with `<script setup>`
- All state management goes through `useWageClaw.ts`
- Keep components thin — presentation logic only
- TypeScript strict mode is enforced
- Follow existing naming conventions (camelCase for variables/functions, PascalCase for types)

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add pet evolution animation
fix: correct salary calculation on weekends
docs: update README with new screenshots
refactor: extract mall filtering logic
```

## Reporting Issues

Use the GitHub issue tracker. Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your OS and Node.js version

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
