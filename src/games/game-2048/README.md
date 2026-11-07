# #137 Merge to 2048

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

The 2048-style sliding merge puzzle (a generic title) on the shared merge core in
`../shared/merge/` (`engine.ts` rules, seeded spawns, slides and expectimax search, `play.ts`
state with undo and replay validation, `ai.ts` agents and environment factory, `MergeGame.tsx`
table, strings, sounds). Here: `engine.ts` (the equal-pair rule and the board sizes),
`ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`.
