# #089 Omaha Hold'em

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module over the shared poker family in `src/games/shared/poker/` (see the Texas Hold'em
README for the files): the engine's `OMAHA` variant deals four hole cards and caps raises at the
pot, `hands.ts` scores exactly two hole cards with exactly three board cards, and the table shows
four cards per seat with pot-limit presets. This folder holds `rules.ts`, `ai.ts`, `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg` and `tests/`.
