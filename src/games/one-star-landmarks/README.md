# #240 One-Star Landmarks

A geography guessing game (generic name; original design and writing — similar games show a real
one-star review of a famous place; here every review is written for this game and none is
copied from a review site). Each round is a grumpy review of a famous place, revealed line by
line; the player names the place, and every wrong guess gives the distance and direction to the
answer, like a map-hunting game, so text reading and geography combine.

| File                          | Role                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `reviews.ts`                  | The 137 reviews (three lines, English and Spanish) and countries       |
| `engine.ts`                   | Pure rules: places, distance, bearing, rounds, pools, sessions, search |
| `OneStarGame.tsx`             | Menu, record, review card, name search, hints, reveal, results         |
| `PlaceMap.tsx`                | World map (shared Natural Earth shapes) with guess pins and the answer |
| `ai-adapter.ts`               | `GameEnvironment` and agents (random, triangulator, review reader)     |
| `landmarks.json`              | Names, coordinates, fame, descriptions (generated)                     |
| `tools/fetch-landmarks.ts`    | Wikidata download of exactly the reviewed places (QLever)              |
| `tools/generate-landmarks.ts` | Validation and build of `landmarks.json`                               |

## Specification

### Places and reviews

137 famous places — monuments, buildings, ruins, museums, bridges, mountains, waterfalls, parks —
chosen from Wikidata items with 38+ sitelinks (109 of them have 70+) for being widely known and
visitable. Left out on purpose: memorials and sites of tragedies (a joking review would be cruel),
places of contested or active worship where mockery could offend, government sites in the news,
cities and airports. Regions: Europe 66, the Americas 35, Asia 22, Africa & Oceania 14.

Each review has three lines per language, from vague (a grumble about the visit) to revealing
(what it looks like, then a near-giveaway) — about queues, stairs, prices, weather and
expectations, never about people or faith, and never naming the place, its city or its country
(a test checks every distinctive word of both names and the countries). The country on the
reveal is written with the review (Wikidata's country statement is wrong or partial for border
landmarks and ancient sites). Every factual claim in the reviews was reviewed line by line after
writing; a handful were corrected before release (see `docs/GAME_EXPANSION_TESTS.md`).

Names, coordinates (preferred-rank statement), sitelinks and the English description come from
Wikidata (CC0) through QLever's Wikidata endpoint, with common-name overrides for eight formal
labels (“Sagrada Família”, “Champs-Élysées”…). The build stops if a reviewed place is missing.

### Ruleset (`one-star-landmarks-5`)

- The first line of the review is shown; each miss reveals the next (three lines in all).
- The player names a place from the list of 137 (search in English or Spanish, accents ignored).
- A miss gives the great-circle distance (km), the initial compass bearing from the guess to the
  answer (eight points) and closeness = 100 × (1 − distance / 20,015 km).
- Five guesses: 100, 75, 50, 30, 15 points for a find on guess 1–5; 0 after five misses or a
  give-up. The same place cannot be named twice in a round.

### Modes, interface, controls

Daily (five Normal places, never two in a row from one region, 500 max, share grid) and Endless
(difficulty: the most-linked 40 %, 75 % or all; region; the last 100 places avoided; End run).
The review card has an invented reviewer (first names only), one star of five and the lines so
far; hints list each miss with an arrow, distance and a closeness bar; the map frames the guesses
and, after the round, the answer star with dashed lines from each guess. Keyboard: type, ↑ ↓ to
choose, Enter to guess, Esc to clear; mouse / touch: tap a suggestion.

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-round), daily totals, seen places, difficulty,
region and the record (places, found, found first time, daily streak). Achievements: Found It,
Seasoned Traveller (first-line find), Last Stop (fifth-guess find), Globetrotter (50 finds),
Frequent Flyer (7-day streak).

### AI interface

Action i names place i (legal: not yet named this round). Observation: the review lines shown
(both languages), the hints of earlier misses, the places named — never the answer or its id.
Agents: Random; Triangulator (ignores the text; names the most famous place consistent with every
hint — same rounded distance ±1 km and compass point); Review reader (among the consistent
places, the one whose Wikidata description shares the most idf-weighted words with the review,
fame breaking ties). `npm run evaluate -- one-star-landmarks <a> <a> 200 7`, mean total out of
500: Random 15.0, Triangulator 350.3, **Review reader 364.5**. (The exact distance makes the second
guess decisive for an agent; people only read the arrow and a rounded figure.)

### Tests

`tests/engine.test.ts`: every reviewed place present with valid coordinates, names and region;
three lines per language that never name the place or country; spot coordinates (Eiffel Tower,
Statue of Liberty, Sydney Opera House, Machu Picchu, Alhambra); distance, bearing, compass and
closeness; hits by guess number, line reveals, five-miss loss, give-up, repeated names rejected;
the daily (deterministic, regions alternate, share grid); pools; endless runs, validation and
finishing; search in both languages ignoring accents; the consistent set always holds the
answer; agent ordering; adapter contract. `tests/ui.test.tsx`: the daily with a miss (hint, new
line, map), finds by keyboard and click, a give-up (375 / 500); empty pick warning, resume, End run.
`tests/e2e/games/one-star-landmarks.spec.ts`: a full daily with a tour of wrong guesses, hints,
map and reveal (desktop + mobile), and keyboard picking with resume.

### Simplifications

None known. The place list is fixed (137 places); a long-and-thin place (the Great Wall, the
Panama Canal, the Great Barrier Reef) is measured from Wikidata's single coordinate for it.
