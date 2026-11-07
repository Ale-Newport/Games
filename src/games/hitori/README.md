# #111 Hitori

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (twins, connectivity, the techniques for hints, the exact
solver, the generator, play state with marks, undo/redo, mistakes, rule breaks and save validation
by regeneration), `ai.ts` (random, technique and exact agents), `ai-adapter.ts`, `HitoriGame.tsx`
and `Hitori.module.css` (menu, grid with shaded/kept cells, tap modes, hints, watch mode, saves,
statistics, achievements; reuses the sudoku table's styles, sounds and strings), `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
