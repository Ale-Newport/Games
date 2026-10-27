# #108 Kakuro

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (runs and digit combinations, the exact solver, the techniques
for hints, the layout/fill/repair/givens generator, play state with notes, undo/redo, mistakes and
save validation by regeneration), `ai.ts` (random, technique and exact agents), `ai-adapter.ts`
(one puzzle per episode), `KakuroGame.tsx` and `Kakuro.module.css` (menu, clue cells, combinations
helper, hints, watch mode, saves, statistics, achievements; reuses the sudoku table's styles,
sounds and strings), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`.
