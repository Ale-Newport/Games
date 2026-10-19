# #001 Tic-Tac-Toe

Classic 3×3 noughts and crosses. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

## Files

| File                                   | Role                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `rules.ts`, `rules-meta.ts`            | Ruleset binding of the shared m,n,k engine (`../shared/mnk/engine.ts`), fork/mark helpers, version ids |
| `match.ts`                             | Pure match flow: modes, rounds, scores, undo, save validation                                          |
| `ai.ts`                                | Computer opponents (Random, Easy, Medium, Perfect) from the generic agents                             |
| `ai-adapter.ts`                        | `GameEnvironment` + `AiBundle` (`tic-tac-toe`, ruleset `classic-3x3`)                                  |
| `Game.tsx`, `Game.module.css`          | Menu, scoreboard, board, controls, keyboard, sounds, stats, achievements, save                         |
| `../shared/mnk/MnkBoard.tsx`           | Accessible animated SVG board shared with #002 and #004                                                |
| `HowToPlay.tsx`, `i18n.ts`, `audio.ts` | Rules dialog content, EN/ES strings, synthesized sound specs                                           |
| `assets/preview.svg`                   | Original card illustration                                                                             |

## Verification

- `npm run test:game -- tic-tac-toe` — rules (exhaustive: 5,478 positions, 958 terminals =
  626 X wins / 316 O wins / 16 draws), Perfect agent never loses (exhaustive over all opponent
  replies, both seats), agent strength ordering, adapter contract, match flow, saves, UI.
- `tests/e2e/games/tic-tac-toe.spec.ts` — browser play-throughs on desktop and mobile.

## Notes

- Perfect play is computed by generic alpha-beta search with a transposition table, not a lookup
  table, so the same agent generalizes to #002 and #004.
- Watch mode is not saved and records no statistics.
