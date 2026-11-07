# #110 Futoshiki

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Module over the shared sudoku core in `../shared/sudoku/` — Latin-square geometry, per-difficulty
sizes, and `signs.ts` (the inequality propagator for the solver, the inequality technique and the
sign drawing), with the generator taking rules drawn per candidate solution: `engine.ts` (the
variant with four sizes and `brokenSigns`), `Signs.tsx` and `Futoshiki.module.css` (chevrons on the
cell borders, red when broken), `Game.tsx`, `ai-adapter.ts`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
