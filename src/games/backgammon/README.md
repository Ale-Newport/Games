# #141 Backgammon

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Standard backgammon with the doubling cube. `engine.ts` (positions, single steps, legal step
orders and plays, pips, gammons), `evaluate.ts` (evaluation, win chance, greedy and expectimax
choosers, doubling window), `match.ts` (match state with the cube and the Crawford rule, actions,
replay validation), `ai.ts`, `ai-adapter.ts`, `BackgammonGame.tsx` + `Backgammon.module.css`,
`HowToPlay.tsx`, `i18n.ts`, `sounds.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`. The
board view is shared with Narde in `../shared/raceboard/`.
