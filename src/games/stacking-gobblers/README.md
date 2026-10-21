# #035 Nesting Tic-Tac-Toe

Catalog entry "Gobblet Gobblers"; shipped under a generic title with original cup artwork, since
the product name is a trademark. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (stacks, reserves, covering, uncovering rule, repetition),
`ai.ts` (alpha-beta presets and the line evaluation), `ai-adapter.ts` (`GameEnvironment`, codec),
`GobbleBoard.tsx` (board with stacks, reserves, two-step input), `Game.tsx`, `HowToPlay.tsx`,
`i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
