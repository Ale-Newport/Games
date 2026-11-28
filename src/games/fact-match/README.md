# #241 Fact Match

A matching puzzle over real data (generic name; original design — no public rules for a game
called “Decoydle” could be found; the nearest, Nerdle's Decoy, is an anagram with a decoy tile).
Here a board of five facts of one family must be matched with seven true numbers, two of which
are decoys taken from the same family. Distinct from the other estimation games: no free-form
answer, but ordering, elimination and deduction across three checks.

| File                | Role                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `engine.ts`         | Pure rules: families, boards, placing, checking, scoring, sessions    |
| `FactMatchGame.tsx` | Menu, record, board (facts, slots, tray), reveal with decoys, results |
| `ai-adapter.ts`     | `GameEnvironment` and agents (random, ranker, expert)                 |
| `i18n.ts`           | Strings (kinds, units, topics shared with Rough Guess)                |

## Specification

### Families (the #233 / #234 bank, no new data)

| Family          | Facts on a board                                                                                                                                                         | Source                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `p:<commodity>` | Five years of one commodity's annual price                                                                                                                               | World Bank Pink Sheet (CC BY 4.0)        |
| `d:<origin>`    | Distances from one well-known city to five cities in other countries                                                                                                     | Wikidata coordinates (CC0), great circle |
| `e:<property>`  | Melting / boiling point, density or atomic mass of five elements                                                                                                         | Wikidata (CC0)                           |
| `m:<kind>`      | One world fact for five places (city or country population, GDP, river length, mountain height, country / island / lake area, building height, planet and moon diameter) | Wikidata, World Bank                     |

Difficulty is the bank's (Easy: famous subjects; Hard: everything); distance origins need 200+
sitelinks (150+ on Hard).

### Ruleset (`fact-match-5x7`)

- A board draws seven members of one family whose values are all at least 6 % apart (so no two
  numbers look alike); five become the facts (price boards sorted by year), two the decoys. The
  seven values are shuffled into the tray.
- Place a number on a fact (it moves if it was elsewhere; a filled slot can be emptied). Locked
  facts and their numbers cannot be touched.
- Check: every placement that is right locks; every wrong one returns to the tray and is
  remembered as a cross (“not US$2.32/kg”). Check is possible once something new is placed.
- Three checks per board; the board ends early when all five are locked. Points: 20 for each
  fact locked on check 1, 12 on check 2, 6 on check 3 — 100 at most.
- The reveal shows every answer, when it locked, and what the two decoys really were.

### Modes, interface, controls

Daily (three Normal boards: a price board, a science-or-distance board, a world board; 300 max;
share grid of locks by check) and Endless (difficulty × topic; the last 40 families avoided; End
run). Tap a number then a fact, or a fact then a number; tap a filled slot to take its number
back. Keyboard: 1–7 pick a number, A–E place it, Enter checks, Esc clears the selection.

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-board), daily totals, seen families, difficulty,
topic and the record (boards, average, perfect boards, daily streak). Achievements: Matched Up,
Clean Sweep (100 on one check), Down to the Wire (complete on the last check), Sharp Eye (250+
daily), Daily Matcher (7-day streak).

### AI interface

Actions: f·7+n places number n on fact f; 35 checks (legal once something new is placed).
Observation: the facts' keys (what each fact is — never its value), the numbers, placements,
locks, crosses and checks. Agents: Random; Ranker (later years / better-known places get bigger
numbers, matched through the best assignment); Expert (estimates each fact from related
knowledge — neighbouring years of the same price, neighbouring elements, a flat-map reading of
city coordinates for distances, fame within world facts — and solves the best one-to-one
assignment, exhaustively over at most 7P5 options, under every cross and lock).
`npm run evaluate -- fact-match <a> <a> 200 7`, mean total out of 300: Random 50.9, Ranker
124.4, **Expert 190.4**.

### Tests

`tests/engine.test.ts`: families (enough members, one origin, different countries, all four
topics); 300 random boards (one family, distinct values ≥ 6 % apart, answers are the facts' true
values, decoys are the decoy facts' values, price boards in year order); placing, moving, taking
back; checking with locks, crosses and 20/12/6 scoring; a perfect board; the daily (deterministic,
topic order, 300, share grid); endless boards (topic, no repeats, validation, finishing); the best
assignment respects locks and crosses; agent ordering; check legality; adapter contract.
`tests/ui.test.tsx`: the daily with clicks, fact-first placing, keyboard and a crossed decoy (268 /
300); taking a number back, resume, End run. `tests/e2e/games/fact-match.spec.ts`: a full daily by
taps with up to three checks per board (desktop + mobile), and keyboard play with resume.

### Simplifications

None known.
