# #203 Category Letters

The category-list word race made popular online by Scattergories-style sites (generic name;
original lists, art and sound): roll a letter, fill the list before the timer ends, and only
answers nobody else wrote score.

| File                                                                         | Role                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `categories.ts`                                                              | 16 classic categories with separate English and Spanish answer lists   |
| `engine.ts`                                                                  | Pure rules: die, lists, bots, key letter, votes, duplicates, scoring   |
| `ai-adapter.ts`                                                              | `GameEnvironment` (one round vs bots) and agents                       |
| `CategoryGame.tsx` + module CSS                                              | Menu, die roll, timed list, hand-overs, review and votes, final scores |
| `Game.tsx`                                                                   | Achievements                                                           |
| `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`, `manifest.ts`, `assets/preview.svg` | Rules, strings, sounds, metadata, art                                  |

## Specification

### Ruleset (`category-letters-classic`)

- **Letter die**: English A–W without Q, U, V, X, Y, Z (20 faces, like the classic die); Spanish
  without K, Ñ, Q, U, W, X, Y, Z. "Whole alphabet" adds every letter (Ñ in Spanish). A letter is
  not repeated within a game while fresh letters remain.
- **List**: 6, 9 or 12 categories drawn at random from 56 (the 40 survey categories of
  #201/#202 plus 16 classics: names, cities, countries, things that fly, verbs, adjectives…).
- **Timer**: 1:00, 1:30, 2:00 or 3:00. Lists are handed in when it ends or with "I'm done".
- **Key letter**: accents folded (Ñ kept), leading articles ("the/a/an", "el/la/los/las/un/una…")
  skipped.
- **Validation**: answers in the bank (either language) are valid. Unknown answers go to a vote:
  the bots accept an answer when it looks like a word (letters only, three or more, a vowel, no
  letter tripled) — **simplification:** they cannot judge meaning. When another human is at the
  table, the humans' vote replaces the bots'. The author never votes on their own answer.
- **Scoring**: 1 point per valid answer that nobody else gave in that category; matching answers
  (same key after normalizing case, accents, articles, plurals, spacing) score 0 for everyone.
  Optional alliteration bonus: +1 per further word that starts with the letter.
- **Rounds**: 1, 3 or 5; highest total wins (ties shared).

### Bots

Up to five bots answer from the bank, only with answers that start with the letter. Easy bots
fill about 45% of the list and prefer the most familiar answers (so they collide often); normal
about 72%; sharp bots about 92% and prefer rarer answers. Their lists stay hidden until review.

### Modes

Vs bots (1 human), shared device (2–4 humans, with or without bots, hidden hand-overs), Watch the
AI (an original-thinker agent fills a list live). Resume restores the current stage, the draft and
the time left.

### Save format

`saveSlot` schema 1: `{ state, draft, remainingMs, settings, names }`; `state` validated by
`isValidState`.

### AI interface

Single-player round vs bots; config `{ lang?, bots?, skill?, size? }`. The list is filled in
order: actions `a:<answer>` (a known answer for the current category with the letter) or `skip`.
Reward: points / list size. Agents: random, obvious answers, original thinker.

### Tests

`tests/game.test.ts` (bank coverage for every die letter in both languages, key letter, word
check, alliteration, duplicates and votes, multi-round letters and bot answers, original beats
obvious, achievements, adapter contract), `tests/ui.test.tsx` (solo round with review, two humans
with the timer, watch mode), `tests/e2e/games/category-letters.spec.ts`.
