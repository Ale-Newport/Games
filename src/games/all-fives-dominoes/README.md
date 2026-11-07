# #158 All Fives Dominoes

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The rules, players and table live in the shared domino core, `../shared/bones/` (`engine.ts`,
`ai.ts`, `environment.ts`, `BonesTable.tsx`, `Tile.tsx`). This folder binds them: `Game.tsx`
(rules and achievements), `ai-adapter.ts`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`,
`assets/preview.svg`, `tests/`.
