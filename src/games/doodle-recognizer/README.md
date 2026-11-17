# #227 Doodle Recognizer

The draw-and-let-the-machine-guess game made famous by an online neural-network experiment
(generic name, original look). It reuses the doodle recognizer shared with #213 Sketch & Guess:
a small network trained in this repo on Quick Draw data (CC BY 4.0, see `docs/asset-licenses.md`).

| File               | Role                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `engine.ts`        | Pure rules: six words, rounds, recognition, scoring                   |
| `DoodleGame.tsx`   | Word cards, drawing with live guesses (and optional voice), summary   |
| `ai-adapter.ts`    | Environment from the recognizer's side, with real doodles; agents     |
| `../shared/doodle` | Sketchpad, rasterizer, the network (59 classes) and reference doodles |

## Specification

### Ruleset (`doodle-recognizer-6x20`)

- Six different words per game from the 59 classes the network knows (seeded shuffle).
- Each round: the word is shown; press Got it and draw for up to 20 seconds. Every 0.4 s the
  current drawing is rasterized (28 × 28, as in training) and classified; the top three guesses
  are shown ("I see a, or b, or c"). The round is recognized as soon as the top guess is the word
  with at least 15 % probability. Time running out or Skip ends the round unrecognized.
- The score is the number of drawings recognized (0–6); each round keeps its time.
- The summary shows the six drawings with ✓/✗, the time to recognition, or the network's last
  guesses when it failed.

The network (two dense layers, int8 weights) reaches 73 % top-1 and 89 % top-3 on held-out
doodles; a test checks it names most reference doodles of their own word.

### AI environment

The recognizer's side: six real human doodles drawn in ten steps; at each step `wait` or name a
word; the right word wins that round. Reward: rounds won. Agents: random and the network itself.

### Options and saves

A Voice toggle reads the guesses out loud with the browser's speech synthesis (saved, off by
default). Each game records its score.

### Controls

Mouse, pen or touch on the drawing pad; Clear and Skip buttons.

### Graphics and audio

A white pad with a bold ink line, a big word card, a countdown that turns red in the last five
seconds, the live guess line, and a summary grid of thumbnails. Chimes for recognized and missed
rounds; optional speech.

### Simplifications

59 words instead of the original's 345; no global gallery of other players' drawings.

### Achievements

first (a drawing recognized), speedy (recognized in under 4 s), perfect (6 of 6).

### Tests

`tests/engine.test.ts` (dealing, scoring, recognition threshold, the network on reference doodles,
the network agent in the environment, adapter contract), `tests/ui.test.tsx` (drawing a real
doodle on the pad through pointer events, timing out, the summary),
`tests/e2e/games/doodle-recognizer.spec.ts`.
