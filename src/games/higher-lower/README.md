# #225 Higher or Lower

The viral comparison streak game (generic name, original look). The original compares monthly
web-search volumes, which a static site cannot fetch; this version uses real reference figures
instead.

| File                  | Role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `data.ts`             | The decks: countries (shared world data), mountains, rivers, animals |
| `engine.ts`           | Pure rules: dealing, guessing, scoring, mix mode                     |
| `HigherLowerGame.tsx` | Category menu, two cards, count-up reveal, game over, best scores    |
| `ai-adapter.ts`       | Environment and agents                                               |

## Specification

### Ruleset (`higher-lower-classic`)

- The left card shows an item and its number; the right card shows another item of the same
  category with its number hidden. Guess Higher or Lower; a tie counts as right either way.
- A right guess scores a point; the right card becomes the left card and a new card is dealt.
  The first wrong guess ends the run.
- Decks are shuffled with a seed, never deal the same card twice in a row, avoid an identical
  number to the card shown, and reshuffle (same category) when they run out.
- Categories: country population (2023 estimates, countries over half a million people), country
  area (km²), summit heights (m, 50 mountains), river lengths (km, 42 rivers; lengths differ
  between sources, so they are approximate) and typical adult animal weights (kg, 45 animals;
  approximate averages). Mix starts a random category and switches every five points.

### Agents

Random, and Median: it only knows where the shown number ranks in its category (top half →
Lower, bottom half → Higher). Over 40 population runs it averages well above a coin flip.

### Saves and scoring

Each run records its streak (mode = category). Best streaks per category are saved (`schema 1`).

### Controls

Buttons, or ↑ / H for Higher and ↓ / L for Lower.

### Graphics and audio

Two full-height cards tinted by category with a flag (flag-icons) or an emoji, the name and the
number; the hidden number counts up when revealed (instantly with reduced motion); a VS badge turns
into a green tick or red cross; game-over panel with the score. Sounds for right and wrong.

### Achievements

score-10, score-25, score-50, mix-20, all-categories (10 in each of the five).

### Tests

`tests/engine.test.ts` (deck sizes and data, scoring and moving cards, long runs in every mode,
the median player beating chance, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/higher-lower.spec.ts`.
