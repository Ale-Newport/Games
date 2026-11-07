# #091 Kuhn Poker

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Self-contained module: `engine.ts` (the three-card game, a match to the last chip, replay
validation), `ai.ts` (the game as a CFR tree, the CFR+ Nash equilibrium and two hand-written
strategies), `ai-adapter.ts` (one hand per episode), `Game.tsx` (the table definition),
`HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`. The solver lives in
`src/ai/agents/cfr.ts`; the table in `src/games/shared/heads-up-poker/` (shared with Leduc poker).
