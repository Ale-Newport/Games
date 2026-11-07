# #103 Sudoku 6×6

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared sudoku core in `../shared/sudoku/` (geometry, exact solver, human
techniques, generator, play state, agents and environment, `SudokuGame.tsx` table, rules):
`engine.ts` (the variant: 6×6 with 2×3 boxes and the three difficulty specs), `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
