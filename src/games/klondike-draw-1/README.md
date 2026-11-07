# #071 Klondike — Draw One

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Thin module on three new shared pieces:

- `src/games/shared/cards/` — card numbering, seeded shuffles, names, and the original SVG card
  art (`CardView`, with a four-color mode for colorblind players).
- `src/games/shared/solitaire/` — the patience shell (`SolitaireGame`): responsive layout with
  compressing fans, tap / drag / keyboard input, undo, hints, automatic finish, Watch AI, clock,
  score, statistics, achievements and saves. `?deal=N` opens a given deal.
- `src/games/shared/klondike/` — the Klondike engine (draw one or three), the greedy and planner
  agents, the environment factory and the shell definition, shared with #072.

Here: `rules.ts` (draw one), `ai-adapter.ts`, `Game.tsx` (achievements), `HowToPlay.tsx`,
`i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
