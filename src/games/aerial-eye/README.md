# #242 Aerial Eye

An aerial-photo identification game (generic name; original design — no public game called
“Analyst Eye” could be found; similar games ask for a location from satellite views). Each round
is a real aerial photograph of a place, zoomed in on its centre, with six places of the same kind
to choose from; wrong picks zoom the photo out. Reading the ground — runway layouts, track shapes,
coastlines, crater rims, street grids — is the skill.

| File                           | Role                                                                      |
| ------------------------------ | ------------------------------------------------------------------------- |
| `engine.ts`                    | Pure rules: categories, pools, rounds, zoom, scoring, sessions            |
| `AerialGame.tsx`               | Menu, record, photo with zoom, options, reveal with map and credit        |
| `ai-adapter.ts`                | `GameEnvironment` and agents (random, best known, colour reader)          |
| `places.json`, `credits.json`  | Places, photos' colour features; per-photo author and licence (generated) |
| `images/`                      | 365 aerial photographs, 380 px JPEGs (generated)                          |
| `tools/fetch-aerial.ts`        | Wikidata download of places with an aerial view (QLever)                  |
| `tools/generate-aerial.ts`     | Categories, filters, selection                                            |
| `tools/fetch-aerial-images.ts` | Commons thumbnails, credits, colour features (Pillow)                     |

## Specification

### Places and photographs

Wikidata items with an **aerial view** (P8592) and 25+ sitelinks, downloaded 2026-11-28 through
QLever's Wikidata endpoint (CC0). Category by class, in priority order: airport, racing circuit,
city, historic site (archaeological sites, ancient cities, amphitheatres), stadium, castle or
palace, volcano, mountain, island, lake, river; the best-known places of each kind are kept
(airports 40, circuits 30, cities 60, historic sites 21, stadiums 30, castles 40, volcanoes 27,
mountains 30, islands 40, lakes 24, rivers 30 before photo checks). Left out: files that are not
photographs (maps, plans, locator images), places of worship and contested holy sites, a
micronation, and items whose country is a historical state. 365 places have a downloadable photo
with a licence and are in the game.

The photos come from Wikimedia Commons, each under its own free licence (CC BY-SA 4.0 142, public
domain 53, CC BY-SA 3.0 41, CC BY 2.0 28, CC BY 3.0 17, CC0, FAL, GFDL…); every reveal credits the
author and licence and links the file page. Shrunk to 380 px JPEGs (quality 62, 33 KB on average,
12 MB in all), loaded one at a time.

### Ruleset (`aerial-eye-6`)

- Six options of the same kind: the answer and five others from the same pool, shuffled.
- The photo shows at ×2.2 on its centre; each wrong pick strikes that option and zooms out (×1.5,
  then the whole photo). Three picks: 100, 50 or 20 points; 0 after three misses.

### Modes, interface, controls

Daily (five Normal photos of five different kinds, 500 max, share grid) and Endless (kind of place
× difficulty: the better-known half of each kind, three quarters, or all; the last 150 places
avoided; End run). The reveal shows the whole photo, the answer and its country, a map (shared
with #240) and the credits. Keyboard 1–6 picks; the board keeps focus after a miss.

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-round), daily totals, seen places, difficulty, kind
and the record (photos, found, first-pick finds, daily streak). Achievements: Spotted, Eagle Eye
(10 first-pick finds), All-Rounder (five kinds in one run), Chief Analyst (500 daily), Daily
Flyover (7-day streak).

### AI interface

Action i picks option i (0–5). Observation: the kind, the six options (place indices), the struck
options and the photo's colour as far as it is visible — the mean RGB of the centre cell of a
3 × 3 grid at the first zoom, all nine cells afterwards (measured from the shipped JPEGs at build
time). Agents: Random; Best known (ignores the photo); Colour reader (predicts each option's
colours from the photos of the three nearest places of the same kind — never from any option's
own photo, so the answer's photo is never consulted — and picks the closest). Colour is a weak
cue (light, season and angle dominate): offline, the reader's first pick is right about 24 % of
the time against 16.7 % by chance. `npm run evaluate -- aerial-eye <a> <a> 300 7`, mean total out
of 500: Random 140.5 (141.7 expected), Best known 141.4, **Colour reader 161.9**.

### Tests

`tests/engine.test.ts`: every place has a photo, a credit with a licence, a kind, names, a country
and colours; every kind has six options at every difficulty; options, zoom-out, 100/50/20 scoring,
three-miss loss, repeated and foreign picks rejected; the daily (five kinds, deterministic, share
grid); endless runs (kind, no repeats, validation, finishing); the observation shows only visible
colours; predictions never depend on the options' own photos; the colour reader beats chance;
adapter contract. `tests/ui.test.tsx`: the daily with a miss (zoom 1.5), picks by click and key,
credit and map, three misses (350 / 500); resume and End run. `tests/e2e/games/aerial-eye.spec.ts`:
a full daily (desktop + mobile) and keyboard picks after a miss with resume.

### Simplifications

None known. Places are one photo each (the one Wikidata names as the aerial view).
