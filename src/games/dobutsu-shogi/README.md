# #022 Animal Shogi 3×4

A pocket shogi on a 3×4 board (catalog entry "Dōbutsu Shōgi"; shown under a generic title with
original artwork). Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A thin module on the shared shogi family (`src/games/shared/shogi/`, see
[`../shogi/README.md`](../shogi/README.md)): the `ANIMAL` variant (lion, giraffe, elephant, chick →
hen; royal-capture goal; try rule; compulsory promotion; threefold repetition), animal tiles with
movement dots (`ShogiPieces.tsx`), and deeper search levels for the tiny board.

Game-specific: `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
