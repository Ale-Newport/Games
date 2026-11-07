# #077 Pyramid

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Module on the shared card pieces (`src/games/shared/cards/`, `src/games/shared/solitaire/` — which
gained free vertical placement and vanishing piles for this layout): `engine.ts` (pyramid,
pairs of 13, stock with three passes, linear-time replay), `ai.ts` (masked planner, greedy),
`ai-adapter.ts`, `definition.ts`, `Game.tsx` (achievements), `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
