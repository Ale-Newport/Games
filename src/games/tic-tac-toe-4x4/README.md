# #002 Tic-Tac-Toe 4×4

Four in a row on a 4×4 board. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on the shared m,n,k family in `src/games/shared/mnk/` (also used by #001):

| Shared file                   | Role                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `engine.ts`                   | Pure rules (any m, n, k; misère flag)                                                           |
| `solver.ts`                   | Exact bitboard solver (symmetry TT, dead-position + forced-move pruning)                        |
| `agents.ts`                   | `MnkSolverAgent` (perfect, trap-setting tie-breaks), open-line heuristic, center-first ordering |
| `environment.ts`              | `GameEnvironment` factory for the adapters                                                      |
| `match.ts`                    | Match flow: modes, rounds, scores, undo, save validation                                        |
| `MnkGame.tsx`, `MnkBoard.tsx` | Full game UI and board                                                                          |
| `i18n.ts`, `sounds.ts`        | Shared strings and synthesized sounds                                                           |

Game-specific files: `rules.ts` (4×4 rules + achievement predicates), `ai.ts` (difficulty presets),
`ai-adapter.ts`, `match.ts` (config), `Game.tsx` (definition + achievements), `HowToPlay.tsx`,
`i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.

## Performance notes

A plain memoized negamax needs 44M nodes / ~27 s to solve the empty 4×4 board. The shared solver
needs 3.4M nodes / ~0.65 s (desktop). Because every position with ≤ 3 marks is a proven draw, the
Perfect agent skips the search while ≤ 2 marks are down; from the 3-mark position onward a fresh
solve takes ≈ 20–70 ms on desktop and its table is reused for later moves.
