# #113 Slitherlink

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (edge/vertex/cell geometry, loop checks, the techniques for
hints, the exact solver, the region-boundary generator, play state, rule breaks and save validation
by regeneration), `ai.ts` (random, technique and exact agents), `ai-adapter.ts`, `SlitherGame.tsx`
and `Slitherlink.module.css` (menu, SVG grid with tap and dot-to-dot drag input, hints, watch mode,
saves, statistics, achievements; reuses the sudoku table's styles, sounds and strings), `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
