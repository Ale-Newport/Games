# #026 Go 13×13

Go on the 13×13 board. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on `src/games/shared/go/` (shared by #025–#027): `engine.ts` (rules, superko, area scoring),
`mcts.ts` (UCT + RAVE playout engine), `environment.ts` (`GameEnvironment`, rules binding, presets),
`definition.tsx` (shell definition on the shared `GoBoard`, pass button, territory view),
`HowToPlay.tsx`, `i18n.ts`.

Game-specific: `rules.ts` (size, komi, ply limit, achievement predicates), `ai.ts` (levels for this
size), `ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`.
