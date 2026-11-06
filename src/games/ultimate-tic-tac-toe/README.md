# #003 Ultimate Tic-Tac-Toe

Nine linked Tic-Tac-Toe boards with the sending rule. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

| File                                                            | Role                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `engine.ts`, `rules-meta.ts`                                    | Pure rules engine (sending, free choice, local/global wins, drawn boards), 9×9 grid mapping, validation |
| `rules.ts`                                                      | `TwoPlayerRules` binding for the shared shell + achievement predicates                                  |
| `heuristic.ts`                                                  | Static evaluation for alpha-beta opponents                                                              |
| `ai.ts`, `ai-adapter.ts`                                        | Agent presets (Random, Easy, Medium, Hard=MCTS) and the `GameEnvironment`                               |
| `UtttBoard.tsx`                                                 | Board: playable-board glow, captured/drawn overlays, global win line, keyboard                          |
| `Game.tsx`                                                      | Definition for `src/games/shared/two-player/TwoPlayerGame` (sounds, announcements, achievements)        |
| `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg` | Rules dialog, EN/ES strings, metadata, card art (generated original SVG)                                |

## AI notes

Difficulty was chosen by seeded head-to-head measurement (`npm run evaluate`):
Easy vs Random 34–4–2, Medium vs Easy 26–4–0, MCTS-20k vs Medium 13–2–1 (≈210 ms avg, ≤ 600 ms),
MCTS-20k vs time-limited alpha-beta (depth ≤ 10, 400 ms) 6–4–2. No level is perfect; the game is
far too large to solve exactly.

The Hard agent runs on the main thread with a 600 ms cap. Moving agents to a Web Worker is a
platform follow-up (see NEXT_STEPS.md).
