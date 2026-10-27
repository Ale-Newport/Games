# #112 Nonogram

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (runs and clues, the line solver, line propagation with search
as the exact solver, the generator with repair, play state, save validation by regeneration),
`pictures.ts` (ten original hand-drawn pictures), `ai.ts` (random, line and exact agents),
`ai-adapter.ts`, `NonogramGame.tsx` and `Nonogram.module.css` (menu with random sizes and the
picture gallery, clue headers, drag painting, hints, watch mode, saves, statistics, achievements;
reuses the sudoku table's styles, sounds and strings), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
