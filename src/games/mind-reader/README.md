# #226 Mind Reader

A twenty-questions mind reader in the style of the famous online genie (generic name, an original
seer character and an original knowledge base). To stay clear of copyrighted characters and real
people, the worlds are animals, everyday objects, and characters from myth, folk tales and
public-domain classic literature.

| File                 | Role                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `knowledge.ts`       | Three domains: questions and entities with the tags that answer “yes” |
| `engine.ts`          | Bayesian reasoner: odds, information gain, guessing, undo, learning   |
| `MindReaderGame.tsx` | World menu, the seer, questions, guesses, teaching, saved memory      |
| `Seer.tsx`           | The original SVG seer whose crystal ball glows with confidence        |
| `ai-adapter.ts`      | Environment from the guesser’s side and the reasoner agent            |

## Specification

### Ruleset (`mind-reader-bayes`)

- Answers: Yes (1), Probably (0.75), Don’t know (0.5), Probably not (0.25), No (0). Each entity's
  value for a question is 1 if it has the tag, else 0 (blended with learned answers, below).
- Every entity starts equally likely; an answer `a` multiplies an entity's weight by
  `0.05 + 0.9 × (1 − |a − v|)`, so “don't know” is neutral and a wrong answer is survivable.
- Next question: the unasked one with the lowest expected entropy of the odds afterwards.
- It guesses when the top entity passes 80 % (after at least 4 questions), at questions 20, 30 and
  40, or when no question is left. A wrong guess removes that entity and play goes on. Three wrong
  guesses or 45 questions and it gives up.
- Learning: after a game whose answer is known (a right guess, or the player choosing what they
  had in mind), each answer is added to that entity's tally for the question; the entity's value
  becomes `(tag × 3 + sum) / (3 + count)`. Memory is saved per profile.
- Domains: 61 animals × 41 questions, 66 objects × 37 questions, 63 characters × 35 questions.
  A test checks that no two entities have identical answers and that honest play is always read
  (average under 16 questions).

### Saves and scoring

Memory (learned tallies, games won by each side, times taught) is saved (`schema 1`). A game the
reader wins records a loss for the player; a game the reader gives up records a win; the score is
the number of questions.

### AI environment

From the guesser's side: a hidden entity answers truthfully. Actions ask a question (`q:ID`) or
guess (`g:ID`). Reward 1 − questions/50 for a right guess. Agents: random and the reasoner.

### Controls

Answer buttons, or keys Y/S yes, N no, D don't know, P probably, O probably not, Backspace back.

### Graphics and audio

A hooded seer (SVG) whose crystal ball shifts from violet to gold as its confidence grows and
whose face goes from pondering to sure, pleased or downcast; a speech bubble with the question,
a confidence meter, the guess with its emoji, a searchable list to teach it. Soft chimes.

### Achievements

stumped (beat it), open-book (read in ≤ 10 questions), teacher (teach it five times).

### Tests

`tests/engine.test.ts` (knowledge consistency, every entity read honestly, noisy answers, undo,
learning, the reasoner in the environment, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/mind-reader.spec.ts`.
