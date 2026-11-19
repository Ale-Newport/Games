# #214 Draw Telephone

The drawing telephone party game (generic name; original look and sentence templates; bots draw
real human doodles from the Quick, Draw! dataset, Google, CC BY 4.0).

| File                      | Role                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `engine.ts`               | Pure rules: chains, seats, steps (write / draw / describe), album  |
| `bots.ts`                 | Bot sentences, descriptions (recognizer) and drawings (by meaning) |
| `TelephoneGame.tsx` + CSS | Lobby, hand-over screens, writing, drawing, describing, album      |
| `ai-adapter.ts`           | Chain-fidelity environment and agents                              |

## Specification

### Ruleset (`draw-telephone-classic`)

- 3–8 players: 1–4 people on one device plus bots. Every chain starts with one player's sentence.
- Step 0: everyone writes a sentence. Then chains move one seat on each step: odd steps draw the
  sentence received, even steps describe the drawing received. Each player sees only the previous
  entry of the chain in hand. After as many steps as players, the album opens.
- Time per step: 60, 90 or 120 s to draw, half that to write or describe; when time runs out the
  entry is handed in as it is ("(nothing)" for an empty sentence).
- The album replays each chain entry by entry, naming who wrote or drew each one.

### Bots

- Write: "a {subject} on holiday", "a giant {subject}"… with a drawable subject (Spanish
  templates avoid gendered words).
- Draw: find a drawable subject named in the sentence (either language, plurals); otherwise the
  subject closest in meaning to any of its words (shared vectors in the chain's language, so "a
  happy puppy" and "un cachorro ladrando" both become a dog); then replay a real human doodle of it.
- Describe: the doodle recognizer's best guess (sometimes its second guess when unsure).

There is no score, as in the original; the fun is the album. **Simplification:** bots understand
only the 59 drawable subjects of the recognizer.

### Saves

`saveSlot` schema 1 keeps lobby settings (language, people and names, bots, time). Games are not
resumed.

### AI interface

Chain-fidelity environment (config `{ length }` players): the agent describes each drawing of a
bot chain with a drawable word (`d:<word>`), the bot draws each description; reward = share of
descriptions that keep the original subject. Agents: random, recognizer (keeps the subject in more
than half of chains in tests).

### Tests

`tests/game.test.ts` (chain routing, alternation, album, bots writing/drawing by meaning/describing,
recognizer fidelity, adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/draw-telephone.spec.ts`.
