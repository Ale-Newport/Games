# #098 Euchre

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (24-card deal, the two bidding rounds with stick-the-dealer,
the dealer's pickup, going alone, bowers, tricks, scoring to 10, replay validation), `ai.ts` (hand
values for each trump, the dealer's throw, partnership play and Hard's sampled-deal search),
`ai-adapter.ts` (four seats, one hand per episode), `EuchreGame.tsx` and `EuchreGame.module.css`
(menu, upcard, bidding buttons with Go alone, play, hints, watch mode, saves, statistics,
achievements), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`. Table and trick helpers: `src/games/shared/tricks/`.
