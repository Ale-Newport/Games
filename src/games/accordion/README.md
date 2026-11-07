# #083 Accordion

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Module on the card shell (`src/games/shared/solitaire/`, `src/games/shared/cards/`): `engine.ts`
(the row, moves one or three to the left, linear-time replay), `ai.ts` (planner over the dealt
cards, greedy), `ai-adapter.ts`, `definition.ts` (a row wrapping onto lines of eight), `Game.tsx`
(achievements), `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
