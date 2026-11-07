# #114 Bridges (Hashiwokakero)

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (facing pairs and crossings, bound-based techniques for hints,
the exact solver with a connectivity check, the island-growing generator, play state, save
validation by regeneration), `ai.ts` (random, technique and exact agents), `ai-adapter.ts`,
`HashiGame.tsx` and `Hashi.module.css` (menu, SVG sea with tap-between and island-to-island input,
hints, watch mode, saves, statistics, achievements; reuses the sudoku table's styles, sounds and
strings), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
