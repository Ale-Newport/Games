# #115 Nurikabe

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (shading checks, the techniques for hints, the exact solver,
the island-growing generator with pool breaking, play state, rule breaks and save validation by
regeneration), `ai.ts` (random, technique and exact agents), `ai-adapter.ts`, `NurikabeGame.tsx`
and `Nurikabe.module.css` (adapted from the Hitori table: menu, grid with sea/land marks, tap modes,
hints, watch mode, saves, statistics, achievements), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
