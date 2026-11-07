# #121 Hangman — Game Specification

## Ruleset (`hangman-categories`)

A hidden word is guessed one letter at a time; a letter in the word is revealed in every place, a
letter that is not costs a life and adds a stroke to the drawing. The word is solved when every
letter is revealed; the game is lost when the lives run out.

| Level  | Wrong letters allowed | Category |
| ------ | --------------------- | -------- |
| Easy   | 8                     | shown    |
| Normal | 6                     | shown    |
| Hard   | 5                     | hidden   |

The drawing has eight strokes (base, pole, beam, rope, head, body, arms, legs); levels with fewer
lives start with the first strokes drawn, and the strokes still to come show faintly.

## Words (`words.ts`)

Written for this game: six categories (animals, food, nature, home, jobs, sports), 280 English and
262 Spanish words of 4–13 letters (Spanish without accents; ñ is a letter). A two-player word is
typed by a player (3–14 letters; accents dropped, ñ kept).

## Modes

Play (chosen language, category or any, level; `?deal=` fixes the word), today's word (any category,
per language), two players (a secret word typed in a password field, then the device is passed),
watch the AI, resume (not for typed words).

## Play features

Alphabet keyboard (with Ñ for Spanish) marking hits and misses, typing on a physical keyboard
(accented vowels type the plain letter), the list of missed letters, messages for each guess, hints
(Shift+H) that count the listed words still fitting and suggest the letter most of them contain
(“Guess X”; hints are counted), the word revealed in red when lost.

## Computer players

| Agent       | Play                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`    | Any unused letter.                                                                                                                                                                                                  |
| `frequency` | Letters from most to least common in the language, ignoring the word.                                                                                                                                               |
| `solver`    | Keeps the listed words that fit the pattern and misses (the category's list when shown) and guesses the letter most of them contain, frequency breaking ties; with no fitting word (a typed word), frequency alone. |

Over every listed word:

| Words / level  | Solver: solved, average misses | Frequency: solved | Random: solved |
| -------------- | ------------------------------ | ----------------- | -------------- |
| English easy   | 100%, 0.39                     | 21.1%             | 0.7%           |
| English normal | 100%, 0.39                     | 10.4%             | 0.4%           |
| English hard   | 100%, 0.84                     | 5.0%              | 0.0%           |
| Spanish easy   | 100%, 0.24                     | 35.1%             | 1.1%           |
| Spanish normal | 100%, 0.24                     | 17.9%             | 0.4%           |
| Spanish hard   | 100%, 0.62                     | 9.5%              | 0.0%           |

The solver takes under 0.03 ms per letter.

## States and actions

`HangmanState`: language, level, seed, category (or `custom`), word, guessed letters, status, hints,
elapsed time. Environment actions are unused letters; the observation shows only the pattern of
guessed letters until the end (the solver plays the same from it). Save validation redraws a listed
word from the seed (from its category or from any category) and replays every letter.

## Achievements

| id         | Condition                                      |
| ---------- | ---------------------------------------------- |
| `first`    | Solve a word.                                  |
| `flawless` | Solve a word without a wrong letter or a hint. |
| `hard`     | Solve a word on Hard without hints.            |
| `close`    | Solve a word with one life left.               |
| `streak`   | Solve five words in a row.                     |

Two-player games are recorded under their own mode and unlock nothing.

## Graphics and audio

An SVG drawing in the text color (red when lost) with faint strokes to come, underlined letter
slots, CSS keys. Synthesized hit and miss sounds and win/lose phrases.

## Save format and AI interface

Save slot schema 1: `{ state }`. Env `hangman` v`1.0.0`: kind `puzzle`, one seat, hidden
information, config `{ lang, level, category }`; return 1 when solved, score = lives left.

## Testing criteria

Clean lists in every category, typed-word cleaning, hits, misses, repeated letters, win and loss,
category draws, save validation (other word, wrong status, repeated letter, typed word), the word
always among the fitting words and the solver solving words on Hard, the frequency fallback for a
typed word, the pattern-only observation, the contract suite; UI: a miss shown and counted, solving
with hints with the result recorded, a friend's accented word lost after six misses. E2E desktop +
mobile.
