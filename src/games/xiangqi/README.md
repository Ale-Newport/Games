# #023 Xiangqi

Chinese chess. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on `src/games/shared/xiangqi/`:

| Shared file                             | Role                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `position.ts`                           | Mutable 9×10 position: palace, river, horse legs, elephant eyes, cannon screens, flying generals, Zobrist, perft, FEN |
| `game.ts`                               | Immutable state, results (mate, stalemate loss, repetition + perpetual check, no-capture, no attackers), notation     |
| `search.ts`                             | Alpha-beta engine (quiescence, TT, killers, ID, contempt)                                                             |
| `environment.ts`                        | `GameEnvironment`, codec `from·90 + to`, `TwoPlayerRules`, agent presets                                              |
| `XiangqiBoard.tsx`, `XiangqiPieces.tsx` | Intersection board (river, palace diagonals) and original round pieces                                                |

Game-specific: `rules.ts` (achievement predicates), `ai.ts`, `ai-adapter.ts`, `Game.tsx` (shell
definition), `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
