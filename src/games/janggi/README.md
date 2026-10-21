# #024 Janggi

Korean chess. Full spec: [GAME_SPEC.md](GAME_SPEC.md).

Lives next to xiangqi in `src/games/shared/xiangqi/`, sharing the point board and the coordinate
helpers:

| Shared file             | Role                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `janggi.ts`             | Position (palace diagonals, long elephant, cannon screens, passing, bikjang, points) and game layer |
| `janggi-search.ts`      | Alpha-beta engine (passing as a move, two-pass and point awareness, contempt)                       |
| `janggi-environment.ts` | `GameEnvironment` (seeded setups), codec with a pass index, `TwoPlayerRules`, agent presets         |
| `JanggiPieces.tsx`      | Original octagonal pieces sized by rank                                                             |
| `XiangqiBoard.tsx`      | Generic point board (`createPointBoard`: river off, pass button on)                                 |

Game-specific: `rules.ts` (random setups, setup reading, achievement predicates), `ai.ts`,
`ai-adapter.ts`, `Game.tsx`, `HowToPlay.tsx`, `i18n.ts`, `manifest.ts`, `assets/preview.svg`,
`tests/`.
