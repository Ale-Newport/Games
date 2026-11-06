# Arcade AI Lab

A static browser platform of fully playable games — real rules, complete modes, original art and
sound — with infrastructure for future AI research (standard environment interface, baseline
agents, reproducible evaluation, and an offline training bridge).

- **200-game roadmap:** [ROADMAP.md](ROADMAP.md) (generated from `src/data/roadmap.ts`)
- **Development journal:** [PROGRESS.md](PROGRESS.md) · **Resume here:** [NEXT_STEPS.md](NEXT_STEPS.md)
- **Docs:** [architecture](docs/architecture.md) · [definition of done](docs/game-standards.md) ·
  [AI integration](docs/ai-integration.md) · [asset licenses](docs/asset-licenses.md)

Only games that are fully implemented and tested appear in the public library; the rest are
tracked on the in-app Roadmap page.

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
| `npm run roadmap`                                             | Regenerate ROADMAP.md                            |
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
