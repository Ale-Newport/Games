# Game Expansion — Continuation Notes

Read `docs/GAME_EXPANSION_PLAN.md` first, then this file.

## State (2026-11-27)

1. **Completed**: #231 Graph Forecast (`graph-forecast`). Commit: `feat(games): complete #231
Graph Forecast`.
2. **Tests passing**: see `docs/GAME_EXPANSION_TESTS.md` (baseline + #231 + full verify).
3. **Current unfinished game**: none in progress. #231–#252 are COMPLETE; next is **#253 Star Council**.
4. **Remaining**: #253–#264 (12 games), all TODO in `src/data/roadmap.ts` and unregistered.
5. **Known defects**: none open for #231. Build prints an `INEFFECTIVE_DYNAMIC_IMPORT` notice for
   `wdi.json` (the AI adapter imports it statically, the game dynamically); the data still ships in
   its own lazy chunk and never in the main bundle (checked).
6. **Relevant files**: `src/games/shared/stats/` (data, formatting, forecasting),
   `src/games/size-sense/` + `tools/{size-queries,fetch-sizes,generate-sizes}.ts`,
   `src/games/graph-forecast/`, `tools/fetch-worldbank.ts`, `tools/generate-stats.ts`,
   `tests/platform/baseline*.{ts,json,txt}`, `src/data/roadmap.ts` (entries 231–264),
   `src/app/pages/{Home,Library}Page.tsx` + `src/app/i18n/strings.ts` (new categories).

## Next steps

1. #253 Star Council (Twilight Imperium-style): an original galactic 4X with politics and
   objectives — own factions, a hex galaxy, resources/influence, fleets, a council with votes,
   public objectives for victory points; rules engine with exhaustive tests and a real AI.
2. Continue in catalog order through #264.
3. Board games (#247–#264) each need a dedicated rules engine with exhaustive rule tests, a real AI
   (MCTS / heuristic search in a Web Worker where needed), original themes and art. Expect several
   sessions each.

## Per-game checklist (from CLAUDE.md, Stages A–G)

README spec → engine + unit tests → UI (SVG/CSS, sounds) → content → manifest, index,
ai-adapter, preview.svg, registries, achievements → `npm run test:game -- <id>`, contract suite,
Playwright spec, real play in the browser (desktop + mobile), screenshots → roadmap entry
COMPLETE + `npm run roadmap`, these docs, README counts → `feat(games): complete #NNN <Name>`.

## Commands

| Purpose                 | Command                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| Dev server              | `npm run dev`                                                                 |
| One game's tests        | `npm run test:game -- <id>`                                                   |
| E2E for one game        | `E2E_PORT=4188 npx playwright test tests/e2e/games/<id>.spec.ts`              |
| Full gate               | `npm run verify` (~20 min with e2e)                                           |
| Roadmap markdown        | `npm run roadmap`                                                             |
| Refresh World Bank data | `npx tsx tools/fetch-worldbank.ts --force && npx tsx tools/generate-stats.ts` |
| Agent evaluation        | `npm run evaluate -- graph-forecast forecaster forecaster 200 7`              |

## Licensing notes

No blockers. Board games will use generic names, original themes, maps, cards and factions;
only the mechanics of the referenced games are reproduced (CLAUDE.md §6).
