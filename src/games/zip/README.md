# #123 Number Trail (Zip)

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A numbered path puzzle under a generic name, with generated puzzles. `engine.ts` (rules, the pruned
path counter, generator with number/wall repair, play state), `ai.ts`, `ai-adapter.ts`,
`TrailGame.tsx` + `Trail.module.css` (SVG trail over the grid), `HowToPlay.tsx`, `i18n.ts` (on the
shared puzzle strings), `manifest.ts`, `assets/preview.svg`, `tests/`.
