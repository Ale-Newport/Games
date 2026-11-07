# #118 Code Breaker

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

A Mastermind-style code-breaking game with original pegs. The scoring, code spaces, consistency
filter and minimax chooser live in the shared `../shared/codeguess/engine.ts` (also used by Bulls and
Cows). Here: `engine.ts` (variants, state, guesses, save validation), `ai.ts` (agents),
`ai-adapter.ts`, `CodeBreakerGame.tsx` + `CodeBreaker.module.css` (table), `HowToPlay.tsx`,
`i18n.ts`, `sounds.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
