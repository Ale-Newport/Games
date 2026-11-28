# #239 Year Guess

A year-guessing game (generic name; original design — no public game called “Time Clocker” could
be found; similar daily games ask for the year of a photo or of a set of events). Each round is
one real dated event from Wikidata, and the player pins its year on a timeline from 3000 BC to 2025. Distinct from the other estimation games: the answer is a date, the scale is time
compressed with age, and the tolerance grows with how long ago the event happened.

| File                      | Role                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `engine.ts`               | Pure rules: years without a year 0, timeline mapping, scoring, pools, sessions, typed-year parser |
| `Timeline.tsx`            | The timeline control (tap / drag, keyboard slider) and the session recap                          |
| `YearGuessGame.tsx`       | Menu, record, play, reveal, results                                                               |
| `ai-adapter.ts`           | `GameEnvironment` and agents (random, typical year, clue words)                                   |
| `events.json`             | The events (generated)                                                                            |
| `tools/year-queries.ts`   | One Wikidata query per kind                                                                       |
| `tools/fetch-years.ts`    | Downloads into `.cache/wikidata/` (one query a minute)                                            |
| `tools/generate-years.ts` | Validation and build of `events.json`                                                             |

## Specification

### Events

5,367 events from Wikidata (CC0), downloaded on 2026-11-28 through QLever's Wikidata endpoint
(dump of 10 Aug 2026 with live updates; WDQS was in an outage and rate-limited to one query a
minute — `tools/fetch-years.ts --wdqs` uses it instead):

| Kind        | Statement                        | Classes / filter                                       | Min. sitelinks | Events |
| ----------- | -------------------------------- | ------------------------------------------------------ | -------------: | -----: |
| Battle      | point in time / start time       | battle, siege                                          |             25 |    503 |
| War         | start time                       | war, civil war, war of independence                    |             30 |    240 |
| Treaty      | point in time / inception        | treaty, peace treaty                                   |             20 |    289 |
| Discovery   | time of discovery or invention   | any item with a discoverer or inventor                 |             60 |    227 |
| Spaceflight | launch date                      | any item with one                                      |             30 |    299 |
| Film        | publication date (earliest)      | film                                                   |             45 |  1,274 |
| Book        | publication date (earliest)      | literary work, novel                                   |             40 |    321 |
| Painting    | inception                        | painting                                               |             20 |    257 |
| Album       | publication date (earliest)      | album                                                  |             25 |    783 |
| Video game  | publication date (earliest)      | video game                                             |             35 |    300 |
| Opening     | official opening date (earliest) | any item with one                                      |             50 |    426 |
| Company     | inception                        | business, enterprise, public company, company          |             50 |    265 |
| Disaster    | point in time                    | earthquake, eruption, disaster, fire, natural disaster |             15 |    183 |

By era: before 500 106, 500–1499 207, 1500–1799 388, 19th century 564, 1900–1959 824, since
1960 3,278 (the oldest: the Battle of Kadesh, 1274 BC). Kinds are drawn first, so films and
albums don't crowd the rest out.

Build rules (`tools/generate-years.ts`): BC years converted from the RDF export's astronomical
numbering (−0479 = 480 BC) to historical; year precision or better; deprecated statements ignored
and preferred rank wins; releases (films, books, albums, video games) and openings take the
earliest year; any other item whose statements disagree is dropped; battles merge “point in time”
and “start time” (dropped if they differ by more than a year); labels fall back to Wikidata's
language-neutral label (Spanish falls back to English first); a parenthetical with digits is
stripped, a name's own year is removed (“1989 Loma Prieta earthquake” → “Loma Prieta
earthquake”) and items whose label still shows
the year (±1) are dropped; descriptions are kept only without digits, centuries or Roman numerals;
same-label items need distinct descriptions; discoveries leave out astronomy, places (which were
inhabited long before being “discovered”) and elements known since antiquity (their Wikidata date
is when they were recognised as elements).

### Ruleset (`year-guess-timeline`)

- Years run …, 2 BC, 1 BC, AD 1, AD 2… (no year 0; stored as −2, −1, 1, 2); errors count across
  the boundary correctly (44 BC to AD 14 is 57 years).
- The timeline maps a year to position log((2036 − 3000 BC) / (2036 − y)) / log(5036 / 11): a year
  near today is wide, a century in antiquity narrow.
- Score: round(100 × 2^(−error / h)), h = max(2, 0.04 × (2026 − year)) — a 2000 film 1 year off →
  71, 5 off → 18; a 1066 battle 20 off → 70; a 490 BC battle 100 off → 50; exact → 100.
- Kinds rotate (kind first, then the event; never the same kind twice in a row).

### Modes, interface, controls

Daily (five Normal events, one per era — antiquity or Middle Ages, 1500–1799, 19th century,
1900–1959, since 1960 — in a seeded shuffled order; 500 max; share line; a recap timeline of
every guess against the truth) and Endless (difficulty × era × topic: war & peace, science &
space, arts & media, places & society; the last 1,500 events avoided; End run at any time).
Difficulty: the most-linked 30 % of each kind (Easy), 65 % (Normal), all (Hard). Input: tap or drag
the timeline; nudges −100, −10, −1, +1, +10, +100; a typed year (“1815”, “44 BC”, “44 a. C.”,
“AD 33”, “-44”); keyboard on the focused timeline: ← → one year (Shift ten), Page Up / Down a
hundred, Home / End, Enter locks in. The reveal shows the answer star on the timeline with the
gap shaded, the error, the event's half-points tolerance and the Wikidata source.

### Saves, statistics, achievements

Versioned slot with the session (resumable), daily totals, seen events, difficulty, era, topic
and the record (events, average, exact years, daily streak). Achievements: Dated, To the Year,
Antiquarian (≥ 80 before AD 500), Historian (all five daily events ≥ 60), Every Day in History
(7-day streak).

### AI interface

Action k (0–1000) guesses the year at timeline position k / 1000 (always within a quarter of the
tolerance of any year). Observation: kind, English and Spanish name and description — never the
year or Wikidata id. Agents: Random; Typical year (the median position of the kind); Clue words
(every word and word pair of the texts shared with other events votes for their positions,
weighted by idf² and split among them, with the kind's median as a prior; the answer is the
weighted median; the event itself is left out). `npm run evaluate -- year-guess <a> <a> 200 7`,
mean total out of 500: Random 12.5, Typical year 43.6, **Clue words 94.5** (the scoring is strict
near today, where most events are).

### Tests

`tests/engine.test.ts`: data integrity (every kind present, valid years, nothing on screen showing
the year, unique ids) and spot checks (Hastings 1066, Versailles 1919, Waterloo 1815, the
telephone 1876; Thermopylae 480 BC, Marathon 490 BC, Alesia 52 BC, Pharsalus 48 BC); no year 0; the timeline is monotonic, invertible and compressed with age;
scoring examples; typed-year parsing; pools by difficulty, era and topic; the daily (one per era,
deterministic, 500 for exact answers, share line); endless runs (no repeats, bad years rejected,
validation, finishing); agent ordering; adapter contract. `tests/ui.test.tsx`: the daily with the
keyboard slider, a nudge, a typed BC year and Enter, the recap; a rejected year, resume, End run.
`tests/e2e/games/year-guess.spec.ts`: a full daily with taps and nudges (desktop + mobile), and
keyboard / typed play with resume.

### Simplifications

None known. Dates are Wikidata's; older dates are mostly recorded in the Julian calendar, which
differs from the Gregorian by at most 13 days, so the year could only differ for a few dates just
around New Year.
