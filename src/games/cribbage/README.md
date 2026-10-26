# #097 Cribbage

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `scoring.ts` (pegging points and the show: fifteens, pairs, runs, flushes,
nobs), `engine.ts` (deal, crib, starter and his heels, pegging with automatic goes, the show,
the game to 121, replay validation), `ai.ts` (Easy, Medium, Hard throws and pegging), `ai-adapter.ts`
(one hand per episode), `CribbageGame.tsx` and `CribbageGame.module.css` (peg board, crib, count,
play log, show breakdown, hints, watch mode, saves, statistics, achievements), `Game.tsx`,
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
