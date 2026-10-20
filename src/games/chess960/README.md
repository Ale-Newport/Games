# #016 Chess960

Fischer random chess. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A thin module on the shared chess family (`src/games/shared/chess/`, see
[`../chess/README.md`](../chess/README.md)): the `CHESS960` variant, a random start per round
(`seed` option of `createChessDefinition`, `restart` keeps it), the start number in the status
line, and Chess960-specific achievements.

Game-specific: `rules.ts` (variant, start number, castling predicate), `ai.ts`, `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
