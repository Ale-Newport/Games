# #205 World Quiz

Geography quizzes in the style of the famous "name every country" challenges (generic name;
quizzes generated from public data, original look): type countries onto a real map, click them by
name, and name capitals and flags against the clock. Built on the shared quiz module
(`../shared/quiz/`, see #204) and the shared world module (`../shared/world/`).

| File                                       | Role                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| `quizzes.ts`                               | The 21 quizzes, generated from the world data           |
| `../shared/world/`                         | Natural Earth shapes, names, aliases, facts, `WorldMap` |
| `Game.tsx`, `ai-adapter.ts`, `manifest.ts` | Achievements, AI bundle, metadata                       |

## Specification

### Ruleset (`world-quiz-21`)

The quiz formats and matching are those of the shared quiz engine (#204): answers are accepted as
they are typed, in English or Spanish, ignoring case, accents, punctuation and leading articles.
Country names also accept common alternatives (USA/EE. UU., UK, Holland, Burma, Ivory Coast,
Czech Republic…), generated from `i18n-iso-countries` plus a hand list.

### Countries

196 sovereign states: the 193 UN members plus Kosovo, Palestine, Taiwan and Vatican City are
counted (Greenland, Puerto Rico and Western Sahara are drawn on the map but not asked).
**Simplification:** the list of what counts as a country is one reasonable convention; borders,
names and capitals follow Natural Earth and common usage and are not political statements.

### Quizzes

- Countries of the world (15 min) and of each continent — map type-in.
- Click the countries of Europe, Africa, Asia and the Americas — map click.
- Capitals of Europe, Asia, Africa, the Americas and Oceania — hint tables (co-capitals and common
  short forms such as La Paz, Washington or Kotte accepted).
- Flags of the world, of Europe and of the Americas — slideshows of flag images.
- Most populous countries (top 25) and largest by area (top 20) — rank and figure as clues.

### Map

`WorldMap` draws Natural Earth 1:50m shapes with a Natural Earth projection; continent quizzes
frame the continent with a lon/lat box. Countries too small to click get a dot. Found countries
turn green, missed ones red, a wrong click flashes orange (colorblind mode uses blue/orange).

### Modes, saves, AI interface

As #204: any quiz, quiz of the day, Watch the AI; `{ attempt, bests }` save; actions `a:<item>`,
`skip`, `give-up`; agents random, casual, expert.

### Tests

`tests/game.test.ts` (196 countries, continent split, every country and capital accepted in both
languages, aliases, map clicks by code, achievements, adapter contract), `tests/ui.test.tsx`
(typing paints the map, giving up reveals the rest), `tests/e2e/games/world-quiz.spec.ts`;
shared world data tests in `../shared/world/tests/`.
