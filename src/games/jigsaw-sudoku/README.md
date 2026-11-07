# #107 Jigsaw Sudoku

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared sudoku core in `../shared/sudoku/` — whose `jigsaw.ts` reshapes the
boxes into random connected regions and colours them, and whose play state carries each puzzle's
regions (`geoFor`): `engine.ts` (the variant and its four difficulty specs), `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
