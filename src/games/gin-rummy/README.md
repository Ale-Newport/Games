# #096 Gin Rummy

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `melds.ts` (sets, runs, the least-deadwood arrangement, lay-offs),
`engine.ts` (deal, draw and discard, knock, gin, undercut, void hands, the match to 100, replay
validation), `ai.ts` (Easy, Medium and Hard with its one-draw lookahead and undercut sampling),
`ai-adapter.ts` (one hand per episode), `GinGame.tsx` and `GinGame.module.css` (menu, piles, the
hand grouped by melds, discard and knock, hints, watch mode, saves, statistics, achievements),
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
