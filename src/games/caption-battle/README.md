# #216 Caption Battle

The meme-captioning party game (generic name; every picture is an original SVG illustration, every
bot caption is original), for up to four people on one device plus bots.

| File                    | Role                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| `scenes.tsx`            | 8 illustrated scenes with English and Spanish bot captions          |
| `engine.ts`             | Pure rules: rounds, captions, 1–5 star ratings, bonus, totals       |
| `CaptionGame.tsx` + CSS | Lobby, hand-overs, captioning with preview, rating, gallery, podium |
| `ai-adapter.ts`         | One-round environment (choose a caption) and agents                 |

## Specification

### Ruleset (`caption-battle-stars`)

- 3 or 5 rounds; each round shows a scene not used yet in the game.
- Captioning: 75 seconds; up to 90 characters; "top / bottom" splits the text like classic memes;
  an empty caption becomes "…".
- Rating: every player rates every other caption 1–5 stars. A caption scores the stars it
  receives; the round's best (ties share) gets +3. Highest total after the last round wins.

### Bots

Bots caption with unused lines from the scene's bank. They rate by a declared taste:
3 stars ± their generosity (−0.7…+0.7), minus up to 1.5 for distance from their favourite length,
+0.6 for relatable phrasing ("me when…", "yo cuando…"), −1.5 for one-word captions, ± seeded
noise. **Simplification:** bots cannot judge humour; their taste is this explicit heuristic.

### Saves

`saveSlot` schema 1 stores lobby settings; games are not resumed.

### AI interface

One round vs four bots (config `{ lang }`): actions `c:<i>` choose a line from a menu (the scene's
bank, lines from other scenes, "lol"); reward = average stars received / 5. Agents: random and
the crowd pleaser (predicts the bots' ratings), which scores higher than random in tests.

### Tests

`tests/game.test.ts` (scenes, captions, ratings, bonus, totals, bot taste, environment, adapter
contract), `tests/ui.test.tsx`, `tests/e2e/games/caption-battle.spec.ts`.
