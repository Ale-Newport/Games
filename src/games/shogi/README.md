# #021 Shogi

Japanese chess. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on the shared shogi family (`src/games/shared/shogi/`, also used by #022):

| Shared file                         | Role                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `variants.ts`                       | Piece tables (oriented vectors, promotion, dead rows, values) and rule switches                        |
| `position.ts`                       | Mutable position: legal moves incl. drops/nifu/uchifuzume, make/unmake, Zobrist, perft, SFEN-like text |
| `game.ts`                           | Immutable state, Western notation, results (mate, capture, try, sennichite, perpetual check)           |
| `search.ts`, `agents.ts`            | Alpha-beta engine and the four levels                                                                  |
| `environment.ts`                    | `GameEnvironment` factory, action codec, `TwoPlayerRules` binding                                      |
| `ShogiBoard.tsx`, `ShogiPieces.tsx` | Board with hands, drops and promotion dialog; original piece art (kanji wedges, animal tiles)          |
| `definition.ts`, `i18n.ts`          | Shell definition builder (sounds, results, clocks) and shared strings                                  |

Game-specific: `rules.ts` (variant + achievement predicates), `ai.ts`, `ai-adapter.ts`, `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts` (piece names), `manifest.ts`, `assets/preview.svg`, `tests/`.
