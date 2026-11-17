# #213 Sketch & Guess

The online draw-and-guess party game (generic name; original look; real human doodles from the
Quick, Draw! dataset, Google, CC BY 4.0) played in a room of bots.

| File                                | Role                                                           |
| ----------------------------------- | -------------------------------------------------------------- |
| `engine.ts`                         | Pure rules: words, judging, hints, scoring, turns, rounds      |
| `SketchGame.tsx` + CSS              | Lobby, word choice, drawing, chat, scoreboard, results, podium |
| `ai-adapter.ts`                     | Guess-the-doodle environment and recognizer agents             |
| `../shared/doodle/`                 | Rasterizer, MLP recognizer, bot doodles, `Sketchpad`           |
| `training/scripts/build_doodles.py` | Trains the recognizer and picks the bot doodles                |

## Specification

### Ruleset (`sketch-guess-classic`)

- One human and 2–7 bots. Each round every player draws once; 2, 3 or 4 rounds; 60, 80 or 120 s.
- The drawer picks one of three unused words (15 s, then a random pick). Words are the 60 doodle
  classes the recognizer knows, named in English or Spanish (aliases accepted, either language).
- Guessers type in the chat. Exact matches (case, accents and spacing ignored) are correct; one
  edit away is "close" and shown only to the guesser. Correct guesses are hidden from the chat.
- The word shows as blanks; letters appear from 40% of the time, one more every 20%, up to half.
- Guesser points: 50 + 350 × time left fraction, minus 25 per earlier guesser, at least 50.
  Drawer: 100 per guesser + up to 100 for being guessed quickly. The turn ends when everyone has
  guessed or the clock runs out; after the last round, the podium.

### Bots

Each bot has its own confidence threshold (35–70%) and reaction delay (1–4 s). When a bot draws,
it replays a real human doodle of the word stroke by stroke over the first 55% of the clock. Bots
guess by running the recognizer on exactly the strokes visible so far; below their threshold they
sometimes type a wrong guess from the recognizer's top three, like real players.
**Simplification:** the original is online with people and thousands of words; here the room is
bots and the word list is the recognizer's 60 classes, so bots can both draw and recognise them.

### Recognizer

A 784-256-128-60 multilayer perceptron on 28×28 anti-aliased rasters of the strokes (same
rasterizer in Python and TypeScript), trained with scikit-learn on up to 2,600 recognised drawings
per class from the start of each Quick Draw "simplified" file; int8 weights (~240 kB). Test
accuracy is recorded in `../shared/doodle/model.json`.

### Saves

`saveSlot` schema 1 keeps the lobby settings. A game in progress is not resumed (rounds are short
and real-time).

### AI interface

Guess-the-doodle environment (config `{ word? }`): a doodle revealed in ten steps; actions `wait`
or `g:<word>`; reward up to 1 for an early right guess, minus 0.1 per wrong guess. Agents: random,
careful recognizer (70%), eager recognizer (35%).

### Tests

`tests/game.test.ts` (judging, hints, scoring, rounds, doodles for every word, recognizer accuracy
on bot doodles, adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/sketch-guess.spec.ts`.
