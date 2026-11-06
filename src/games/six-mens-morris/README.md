# #032 Six Men's Morris

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on `src/games/shared/morris/` (shared by #030–#032): `engine.ts` (boards, phases, mills,
flying, results), `environment.ts` (`GameEnvironment`, codec, evaluation, alpha-beta presets),
`MorrisBoard.tsx` (SVG board with placement, move and removal steps), `definition.ts`,
`HowToPlay.tsx`, `i18n.ts`.

Game-specific: `rules.ts`, `ai.ts`, `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.
