# Arcade AI Lab

[![Verify and deploy](https://github.com/Ale-Newport/Games/actions/workflows/deploy.yml/badge.svg)](https://github.com/Ale-Newport/Games/actions/workflows/deploy.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-static-646cff?logo=vite&logoColor=white)

**▶ Play now: [ale-newport.github.io/Games](https://ale-newport.github.io/Games/)**

A static browser arcade of fully playable games — real rules, complete modes, original art and
synthesized sound — built on a research-ready core: every game exposes a standard environment
interface with baseline agents, reproducible evaluation and an offline training bridge.

- Board and abstract strategy (chess family, go, draughts, m,n,k games, mancala…), card games and
  solitaires, dice and tile games, logic puzzles, arcade, platformers and physics.
- Everything runs client-side: no accounts, no backend, no tracking. English and Spanish UI,
  dark/light themes, colorblind palette, reduced motion, keyboard + mouse + touch.
- Catalog and status: [docs/ROADMAP.md](docs/ROADMAP.md) (generated from `src/data/roadmap.ts`).

## Documentation

| Document                                     | Contents                                          |
| -------------------------------------------- | ------------------------------------------------- |
| [Architecture](docs/architecture.md)         | Platform layers, game module layout, conventions  |
| [Definition of done](docs/game-standards.md) | Checklist every game satisfies before release     |
| [AI integration](docs/ai-integration.md)     | Environment contract, agents, evaluation, servers |
| [Asset licenses](docs/asset-licenses.md)     | Provenance of every asset and dependency          |
| [Training bridge](training/README.md)        | Python side for offline reinforcement learning    |

Each game folder (`src/games/<id>/README.md`) documents its exact ruleset, modes, controls, save
format, tests and AI interface.

## Requirements

- Node.js 22.18+ (CI uses Node 24), npm 10+
- For browser tests: `npx playwright install chromium`
- Optional (offline training only): Python 3.10+

## Getting started

```bash
npm ci
npm run dev          # http://localhost:5173
```

## Scripts

| Command                                                       | Description                                      |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `npm run dev`                                                 | Development server                               |
| `npm run build`                                               | Typecheck and build the static site into `dist/` |
| `npm run preview`                                             | Serve the production build on port 4173          |
| `npm run lint` / `npm run format`                             | ESLint / Prettier                                |
| `npm run typecheck`                                           | TypeScript project check                         |
| `npm test`                                                    | Unit, integration and roadmap tests (Vitest)     |
| `npm run test:game -- <id>`                                   | Tests for one game, e.g. `tic-tac-toe`           |
| `npm run test:e2e`                                            | Playwright browser tests (desktop + mobile)      |
| `npm run validate:roadmap`                                    | Roadmap ↔ registry ↔ docs consistency            |
| `npm run roadmap`                                             | Regenerate docs/ROADMAP.md                       |
| `npm run verify`                                              | Everything above, in order                       |
| `npm run evaluate -- <game> <agentA> <agentB> [games] [seed]` | Reproducible agent evaluation (JSON)             |

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` lints, typechecks, tests, builds, runs Playwright, and on pushes to
`main` publishes `dist/` to GitHub Pages. One-time manual setup in the GitHub repository:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push to `main` (or run the workflow manually from the Actions tab).

The build uses a relative base path and hash routing, so it works unchanged at
`https://<user>.github.io/` and `https://<user>.github.io/<repo>/`, including direct links and
page refreshes. Set `BASE_PATH=/<repo>/` at build time if absolute asset URLs are preferred.

## Project layout

```
src/app/         shell, router, pages          src/core/   platform infrastructure
src/components/  shared UI                     src/games/  one module per game (+ shared/)
src/ai/          environments, agents, eval    src/data/   roadmap (source of truth)
tools/           node scripts                  training/   offline Python bridge
tests/           platform + e2e tests          docs/       documentation
```

## Privacy

Everything is stored locally in the browser (LocalStorage for settings, IndexedDB for profiles,
statistics and saves). No accounts, analytics or servers.
