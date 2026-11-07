# #106 Killer Sudoku

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Module over the shared sudoku core in `../shared/sudoku/` — whose `killer.ts` holds the cage
propagator for the exact solver, the cage techniques (cage combinations, the 45 rule's innies and
outies) and the cage generator: `engine.ts` (the variant with its three cage-size difficulties and
`badCages`), `Cages.tsx` and `Killer.module.css` (dashed cage outlines and sums over the shared
board, red for a broken cage), `Game.tsx`, `ai-adapter.ts`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
