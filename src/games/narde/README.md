# #142 Narde

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Long narde. `engine.ts` (positions in each side's own numbering, single steps, the head and
six-point rules, legal step orders and plays, oin and mars), `evaluate.ts` (tuned evaluation,
greedy and expectimax choosers), `match.ts` (match state, actions, replay validation), `ai.ts`,
`ai-adapter.ts`, `NardeGame.tsx` + `Narde.module.css`, `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`. The board view is shared with Backgammon in
`../shared/raceboard/`.
