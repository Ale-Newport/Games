# #105 X-Sudoku

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared sudoku core in `../shared/sudoku/` (geometry with diagonal units,
solver, techniques, generator, play state, agents, `SudokuGame.tsx`, rules): `engine.ts` (the
variant: 9×9 boxes plus both diagonals, four difficulty specs, `onDiagonal`), `XSudoku.module.css`
and `Game.tsx` (diagonal tint and dashed lines over the shared board), `ai-adapter.ts`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
