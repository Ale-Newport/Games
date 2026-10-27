# #104 Sudoku 16×16

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared sudoku core in `../shared/sudoku/` (geometry, exact solver, human
techniques, generator, play state, agents and environment, `SudokuGame.tsx` table, rules):
`engine.ts` (the variant: 16×16 with 4×4 boxes, symbols 1–9 and A–G, the three difficulty specs with a search budget), `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
