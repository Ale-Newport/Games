# #086 Blackjack

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (six-deck shoe, betting, insurance and the dealer's peek,
hit / stand / double / split, dealer play, settlement, bankroll, replay validation), `ai.ts`
(textbook basic strategy, a dealer mimic), `ai-adapter.ts` (one round per episode),
`BlackjackGame.tsx` (the table: chips, hands, actions, hints, Watch AI, saves, statistics,
achievements), `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`. Cards come from `src/games/shared/cards/`.
