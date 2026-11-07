# #085 Canfield

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Module on the card shell (`src/games/shared/solitaire/`, `src/games/shared/cards/`): `engine.ts`
(reserve, base rank with wrap-around, automatic refills, draw three, stuck rule, replay), `ai.ts`
(masked planner, greedy), `ai-adapter.ts`, `definition.ts`, `Game.tsx` (achievements),
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
