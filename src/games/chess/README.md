# #015 Chess

Standard FIDE chess. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on the shared chess family (`src/games/shared/chess/`, also used by #016–#020):

| Shared file                         | Role                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `position.ts`, `fen.ts`             | Mailbox position with Zobrist keys, legal moves, make/unmake, perft, FEN (incl. Shredder)  |
| `game.ts`, `variants.ts`            | Immutable game layer: SAN, draw rules, variant goals, Chess960 starts; the six variants    |
| `search.ts`, `agents.ts`            | Alpha-beta engine (quiescence, TT, killers, iterative deepening) and the four levels       |
| `environment.ts`                    | `GameEnvironment` factory, action codec, `TwoPlayerRules` binding, flag-fall material rule |
| `ChessBoard.tsx`, `ChessPieces.tsx` | Board UI (click/drag, promotion picker, move list, captures) and the original piece set    |
| `definition.ts`, `i18n.ts`          | Shell definition builder (clocks, resignation, sounds, results)                            |

The two-player shell (`src/games/shared/two-player/`) gained clocks, resignation and agreed draws
for this family; other games are unaffected unless they opt in.

Game-specific: `rules.ts` (variant + achievement predicates), `ai.ts`, `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
