# #109 Calcudoku

Full spec: [GAME_SPEC.md](GAME_SPEC.md). An original arithmetic-cage puzzle in the style of the
trademarked KenKen; the game uses the generic name only.

Module over the shared sudoku core in `../shared/sudoku/` — Latin-square geometry (no boxes),
per-difficulty board sizes, `calc.ts` (cage tuples, the solver propagator, the cage-arithmetic
technique, the generator) and `CageOverlay.tsx` (cage outlines and labels, shared with Killer
Sudoku): `engine.ts` (the variant with four sizes, operation symbols, `badCalc`), `Game.tsx`,
`ai-adapter.ts`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
