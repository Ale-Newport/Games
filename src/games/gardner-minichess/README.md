# #020 Gardner Minichess

Chess on a 5×5 board. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A thin module on the shared chess family (`src/games/shared/chess/`, see
[`../chess/README.md`](../chess/README.md)). The `GARDNER` variant uses the engine's variable board
size (5×5, no double step, no castling); the shared board, codec (`25·25·6 + 2` actions) and
tensor (`[12, 5, 5]`) follow the size; levels search deeper than on 8×8 (`ai.ts`).

Game-specific: `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
