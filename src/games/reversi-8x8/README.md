# #010 Reversi 8×8

The classic disc-flipping game. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on the shared Reversi family (`src/games/shared/reversi/`, also used by #011 6×6):

| Shared file                | Role                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `engine.ts`                | Pure rules: start position, flips, forced pass, end when nobody can move, disc count                             |
| `search.ts`                | `ReversiSearchAgent`: negamax with corner-aware positional weights, mobility, iterative deepening, exact endgame |
| `environment.ts`           | `GameEnvironment` factory (action space N²+1, pass = N²) and `TwoPlayerRules` binding                            |
| `ReversiBoard.tsx`         | Felt board, discs with flip animation, legal-move dots, Pass bar, keyboard                                       |
| `definition.ts`, `i18n.ts` | Shell definition builder (disc counts, sounds, announcements) and strings                                        |

Game-specific: `rules.ts` (size 8, achievement predicates), `ai.ts`, `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
