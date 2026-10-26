# #095 Contract Bridge

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (deal, auction with doubles and redoubles, declarer and dummy,
tricks, duplicate scoring, Chicago vulnerability, replay validation), `bidding.ts` (hand
evaluation and the natural bidding system), `ai.ts` (card play: Easy, Medium heuristics and Hard's
sampled-layout search), `ai-adapter.ts` (four seats, one deal per episode, the declarer acting for
dummy), `BridgeGame.tsx` (menu, bidding box and auction grid, play with dummy, hints, watch mode,
saves, statistics, achievements), `BridgeGame.module.css`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`. Table and trick helpers: `src/games/shared/tricks/`.
