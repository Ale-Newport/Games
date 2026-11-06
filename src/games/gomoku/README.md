# #007 Gomoku

Freestyle Gomoku on 15×15. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

| File                                                            | Role                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `rules.ts`, `rules-meta.ts`                                     | `{ rows: 15, cols: 15, k: 5 }` on the shared m,n,k engine (overlines win)                |
| `ai.ts`, `ai-adapter.ts`                                        | Four levels on `src/games/shared/five/agent.ts`; environment from `createMnkEnvironment` |
| `Game.tsx`                                                      | `createStoneGame` definition (`src/games/shared/goban/stone-game.tsx`) + achievements    |
| `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg` | Rules, strings, metadata, generated original art                                         |

Shared pieces introduced with this game: `src/games/shared/goban/` (`GoBoard` intersection board
with touch confirmation, stone icons, strings, stone-game definition builder — reused by Renju,
Pente and Go) and `src/games/shared/five/agent.ts` (five-in-a-row search agent).
