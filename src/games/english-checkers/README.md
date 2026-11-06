# #012 English Checkers

English draughts / American checkers. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Built on the shared draughts family (`src/games/shared/draughts/`, also used by #013 and #014):

| Shared file                | Role                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `engine.ts`, `variants.ts` | Parameterized rules engine (sizes, men backward capture, flying kings, capture laws, crowning, draw rules) and the three variants |
| `environment.ts`           | `GameEnvironment` factory, `TwoPlayerRules` binding, evaluation                                                                   |
| `agents.ts`                | Alpha-beta presets with captures ordered first                                                                                    |
| `DraughtsBoard.tsx`        | Board UI with step-by-step multi-jump entry, captured-piece preview, crowns                                                       |
| `definition.ts`, `i18n.ts` | Shell definition builder (sounds incl. crowning, piece counts, draw reasons)                                                      |

Game-specific: `rules.ts` (variant + achievement replay), `ai.ts` (tuned levels), `ai-adapter.ts`,
`Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.
