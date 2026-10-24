# #073 FreeCell

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Module on the shared card pieces (`src/games/shared/cards/` art, `src/games/shared/solitaire/`
shell): `engine.ts` (deal, run limits, free cells, safe automatic plays, linear-time replay),
`ai.ts` (best-first solver on canonical positions, greedy baseline), `ai-adapter.ts`,
`definition.ts` (the shell definition), `Game.tsx` (achievements), `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
