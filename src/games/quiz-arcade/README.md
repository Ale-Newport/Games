# #204 Quiz Arcade

Timed trivia quizzes in the formats made popular by the big quiz sites (generic name; every quiz
is original to this project): type-in lists that accept answers as you type, hint tables,
clickable grids, pick-all grids and picture slideshows. Built on the shared quiz module
(`../shared/quiz/`), which #205 World Quiz also uses.

| File                                       | Role                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `quizzes.ts`                               | The 18 quizzes (English and Spanish answers)                         |
| `../shared/quiz/engine.ts`                 | Pure rules: formats, matching, strikes, skips, clock, results        |
| `../shared/quiz/environment.ts`            | `GameEnvironment` factory and knowledge agents                       |
| `../shared/quiz/QuizGame.tsx` + CSS        | Menu with bests and quiz of the day, every format, results, watch AI |
| `Game.tsx`, `ai-adapter.ts`, `manifest.ts` | Achievements, AI bundle, metadata                                    |

## Specification

### Ruleset (`quiz-arcade-18`)

- **Type-in**: the input is checked on every keystroke; a match fills the item (and every other
  open item with the same answer, for hint tables with repeats) and clears the box. Wrong text is
  never penalised. Matching ignores case, accents, punctuation, spacing and leading articles, but
  not plurals, so partial words are not accepted early. English and Spanish answers both count.
- **Slideshow**: one item at a time; "Skip" moves it to the back of the queue.
- **Clickable**: a clue at a time; click its tile among every answer. Wrong clicks are counted.
- **Pick all**: click every correct tile among distractors; three wrong clicks end the quiz.
- **Clock**: each quiz has its own limit (45 s to 15 min). Time out or give up reveals the missed
  answers in red. Result: items found, percentage, time, wrong clicks.

### Quizzes

Elements by symbol (118), planets, continents and oceans, Olympian gods by domain, colours of the
rainbow, zodiac signs, inventors by invention, painters by painting, World Cup winners by year,
bones, Roman numerals (slideshow), name the polygon (drawn shapes), click the planet, click the
element symbol, pick the mammals, pick the primes up to 50, Seven Wonders of the Ancient World,
chess pieces.

### Modes and saves

Any quiz from the menu, the quiz of the day (seeded by date), Watch the AI (an agent that knows
about 85% of answers). `?quiz=<id>` opens a quiz directly. Save (`saveSlot` schema 1):
`{ attempt, bests }` — the attempt in progress and the best percentage per quiz.

### AI interface

Config `{ quiz, lang }`; actions `a:<item>` (answer an item: type it, click its tile), `skip`,
`give-up`; each action spends three seconds of the quiz clock. Reward: percentage / 100. Agents:
random, casual (knows half), expert (knows 95%).

### Tests

`tests/game.test.ts` (bank integrity, every answer accepted in both languages, repeated answers,
slideshow skips, strikes, clicks, clock, agents, achievements, adapter contract),
`tests/ui.test.tsx` (typing without Enter, give up, best saved, pick-all strikes, timeout),
`tests/e2e/games/quiz-arcade.spec.ts`.
