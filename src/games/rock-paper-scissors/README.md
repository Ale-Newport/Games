# #162 Rock Paper Scissors

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The duel, readers, environment and table live in the shared core `../shared/throws/` (`engine.ts`,
`ai.ts`, `environment.ts`, `ThrowTable.tsx`, `Icons.tsx`). This folder binds them: `Game.tsx`
(throws, names, verbs, achievements), `ai-adapter.ts`, `HowToPlay.tsx`, `manifest.ts`,
`assets/preview.svg`, `tests/`.
