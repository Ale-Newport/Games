# #099 Crazy Eights

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (2–4 players, matching suit or rank, wild eights with a named
suit, drawing and passing, reshuffles, blocked hands, scoring to 100, replay validation), `ai.ts`
(Easy, Medium and Hard rules), `ai-adapter.ts` (one hand per episode, 2–4 seats), `EightsGame.tsx`
and `EightsGame.module.css` (menu with the number of opponents, piles and suit badge, the suit
picker, hints, watch mode, saves, statistics, achievements), `Game.tsx`, `HowToPlay.tsx`,
`i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
