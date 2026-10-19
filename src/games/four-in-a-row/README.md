# #005 Four in a Row (Connect Four)

7×6 gravity game, four in a row wins. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on the shared gravity family (`src/games/shared/gravity/`, also used by #006):

| Shared file                | Role                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `engine.ts`                | Pure rules: drops, lines of k, full-board draw, replay validation                                                                     |
| `search.ts`                | `GravitySearchAgent`: mutable make/unmake negamax, Zobrist TT, center-out ordering, iterative deepening, immediate win / forced block |
| `environment.ts`           | `GameEnvironment` factory + `TwoPlayerRules` binding                                                                                  |
| `GravityBoard.tsx`         | SVG frame with masked holes, falling discs, preview, keyboard columns                                                                 |
| `definition.ts`, `i18n.ts` | Two-player shell definition builder and shared strings                                                                                |

Measured (seeded, desktop): Easy vs Random 40–0; Medium (5 plies) vs Easy 29–0–1; Hard vs Medium
16–0; Hard reaches depth 13 from the empty board within its 600 ms budget.
