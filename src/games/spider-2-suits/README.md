# #075 Spider — Two Suits

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module on the new shared Spider family `src/games/shared/spider/` (engine for one, two or
four suits, masked planner and greedy agents, environment factory, shell definition), shared with
#074 and #076, and on the card shell (`src/games/shared/solitaire/`, `src/games/shared/cards/`).
Here: `rules.ts` (two suits), `ai-adapter.ts`, `Game.tsx` (achievements), `HowToPlay.tsx`,
`i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
