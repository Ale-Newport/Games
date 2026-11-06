# CLAUDE.md — Arcade AI Lab

Persistent instructions for every development session. Read this file, then `NEXT_STEPS.md`,
then `PROGRESS.md` before doing anything else.

## Mission

A static (GitHub Pages) browser platform of **exactly 200 fully playable games** (catalog in
`src/data/roadmap.ts`, rendered to `ROADMAP.md`) plus infrastructure for future AI research.
The full original specification is summarized in `docs/` — `docs/game-standards.md` is the
definition of done.

## Non-negotiable rules

1. **One game at a time, in catalog order (001 → 200).** Do not start game N+1 until game N is
   COMPLETE, tested, visually reviewed, documented and committed. Never build parallel shells.
2. **No fakes.** No placeholder games, fake mechanics, hardcoded wins, decorative-only UI, fake
   buttons/leaderboards/charts, invented test results, or simplified versions passed off as full.
   If something is simplified, document it explicitly in the game's `GAME_SPEC.md`.
3. **A game is playable in production only when COMPLETE.** Register it in
   `src/games/registry.ts` and `src/ai/adapters/registry.ts` only at completion. The roadmap test
   (`npm run validate:roadmap`) enforces this.
4. **Never mark anything COMPLETE that is not.** Statuses: TODO, IN_PROGRESS, TESTING, COMPLETE,
   BLOCKED. Update `src/data/roadmap.ts` and run `npm run roadmap` to regenerate `ROADMAP.md`.
5. **Run the tests you claim.** Report real output. `npm run verify` is the full gate.
6. **Original assets only.** No ripped sprites, music, logos, level layouts, or trademarked public
   titles. Mechanics in a genre are fine; names, art, and levels must be our own. Public titles of
   trademarked games use generic names (e.g. "Four in a Row", "Reversi"). Record any third-party
   asset in `docs/asset-licenses.md`.
7. **Rules engines are pure and separate from rendering.** No `Math.random()` in rules — use
   `src/core/game-engine/random.ts` with seeds stored in state. AI adapters wrap the same engine.
8. **Static only.** No backend, no secrets, no paid APIs. Everything runs in the browser.

## Per-game workflow (Stages A–G)

A. Write `src/games/<id>/GAME_SPEC.md` (ruleset, states, actions, scoring, modes, levels,
controls, graphics, audio, save format, tests, AI interface).
B. Rules engine (`rules.ts` / `engine.ts`) + unit tests.
C. Presentation (`Game.tsx`, renderer, CSS module, animations, sounds in `audio.ts`).
D. Content: all modes, levels, difficulty, progression.
E. Integration: `manifest.ts`, `index.ts` (exports `Game` and `Rules`), `ai-adapter.ts`
(exports an `AiBundle`), preview art in `assets/preview.svg`, register in both registries,
achievements.
F. Verification: `npm run test:game -- <id>`, adapter contract suite, Playwright spec in
`tests/e2e/games/<id>.spec.ts`, real play-throughs in the browser (desktop + mobile), screenshots.
G. Finalization: fix issues, `README.md` for the game, update roadmap entry (all parts `done`,
date), `npm run roadmap`, `PROGRESS.md`, `NEXT_STEPS.md`, then a dedicated commit:
`feat(games): complete #NNN <Name>`.

## Layout

- `src/app/` shell, router (hash-based), pages. `src/components/` shared UI.
- `src/core/` platform infrastructure (game-engine contracts, random, grid, input, audio,
  persistence, profiles, settings, replay, achievements, levels, rendering loop, i18n).
- `src/games/<id>/` one self-contained module per game. `src/games/shared/<family>/` code
  genuinely shared by a family: `two-player/` (match shell for every two-player game: menu,
  scoreboard, CPU/watch scheduling, undo, saves, stats) and `mnk/` (m,n,k line games: engine,
  exact solver, agents, board).
- `src/ai/` protocols (environment contract, contract test suite), agents, evaluation, registry.
- `tools/` node scripts (roadmap generator, env server, evaluation CLI). `training/` Python side.
- `tests/platform/` platform tests (roadmap validation), `tests/e2e/` Playwright.

## Commands

| Command                                                     | Purpose                                           |
| ----------------------------------------------------------- | ------------------------------------------------- |
| `npm run dev`                                               | Vite dev server                                   |
| `npm run verify`                                            | lint + typecheck + unit tests + build + e2e       |
| `npm test`                                                  | all Vitest suites                                 |
| `npm run test:game -- <id>`                                 | one game's tests                                  |
| `npm run test:e2e`                                          | Playwright (desktop + mobile projects)            |
| `npm run validate:roadmap`                                  | roadmap/registry consistency                      |
| `npm run roadmap`                                           | regenerate ROADMAP.md                             |
| `npm run evaluate -- <id> <agentA> <agentB> [games] [seed]` | CLI agent evaluation                              |
| `npm run env-server`                                        | JSON-lines environment server for Python training |

## Conventions

- TypeScript strict, `noUncheckedIndexedAccess`. Type-only imports use `import type`.
- Localize every user-facing string (English + Spanish). Game strings live in the game module.
- Colors from CSS tokens (`src/styles/tokens.css`); support dark/light, reduced motion
  (`services.reducedMotion`), colorblind mode (`services.colorblind`, `--player-*` tokens).
- Keyboard, mouse and touch for every game. Clean up listeners/animation frames on unmount.
- Saves use `services.saveSlot({ schema, validate, migrations })` — versioned and validated.
- Commit messages: conventional style. End with the Co-Authored-By line from the session.
