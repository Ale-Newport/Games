# #119 Bulls and Cows

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The pencil-and-paper number deduction game, solo or as a duel against the computer. Scoring, code
spaces, consistency and the guess chooser come from the shared `../shared/codeguess/engine.ts`
(also used by Code Breaker). Here: `engine.ts` (sizes, solo and duel state, turn rule, save
validation), `ai.ts` (agents and the duel levels), `ai-adapter.ts` (the duel environment),
`BullsGame.tsx` + `Bulls.module.css`, `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`.
