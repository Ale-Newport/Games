# #120 Word Guess — Game Specification

A five-letter word guessing game under a generic name, with its own word lists, colors (teal for
right place, amber for elsewhere, each with a ● / ○ marker so color is never the only cue) and texts.

## Ruleset (`word-guess-5x6`)

A hidden five-letter word and six guesses. Each guess must be an accepted word; its letters are
marked right place, elsewhere in the word, or absent. Repeated letters are marked only as many
times as the word contains them, right places first. **Hard mode**: letters found in place must stay
there and every letter found must be used again.

## Words (`words.ts`)

| List    | Answers (hand-picked common words) | Accepted guesses                                                                                                                         |
| ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| English | 981                                | 12 607: the five-letter words of Webster's Second International (1934, public domain), plurals of its four-letter words, and the answers |
| Spanish | 640 (no accents; ñ is a letter)    | 1 521: answers, regular verb forms of five letters (with c→qu, g→gu, z→c spelling changes), plurals of four-letter words and a hand list |

The word language is chosen in the menu (default: the page language). On a physical keyboard an
accented vowel types its plain letter.

## Modes

Today's word (per language, the same for everyone on a date), a random word (`?deal=` fixes it),
hard mode, resume, watch the AI.

## Play features

On-screen keyboard (with Ñ for Spanish) colored by the best mark seen for each letter (absent keys
dimmed); typing on a physical keyboard; tiles that flip in sequence and a row that shakes when a
guess is rejected, with the reason (too short, not in the list, a hard-mode clue ignored). Hints say
how many answers still fit and suggest the solver's word with its average remaining count (“Use
it” types it; hints are counted). Reduced-motion users get no flips or shakes.

## Computer players

| Agent        | Play                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`     | Any accepted word.                                                                                                                                                                |
| `consistent` | A random answer fitting every mark.                                                                                                                                               |
| `solver`     | Among the answers, the word with the smallest expected number of answers left, then the smallest worst case, preferring a possible answer (only clue-obeying words in hard mode). |

Over every answer (981 English, 640 Spanish):

| List / mode   | Solver average | Solver distribution (1/2/3/4/5/6/lost) | Consistent average |
| ------------- | -------------- | -------------------------------------- | ------------------ |
| English       | 3.227          | 1 / 51 / 661 / 260 / 8 / 0 / 0         | 3.642 (3 lost)     |
| English, hard | 3.277          | 1 / 95 / 558 / 287 / 30 / 7 / 3        | —                  |
| Spanish       | 3.094          | 1 / 71 / 439 / 125 / 4 / 0 / 0         | 3.439              |
| Spanish, hard | 3.131          | 1 / 99 / 379 / 138 / 22 / 1 / 0        | —                  |

Openers: ARISE (English, 23.0 answers left on average) and SERIO (Spanish, 15.7); computing the
opener takes 0.2–0.6 s once and is cached; later guesses average 0.7–4.4 ms (max 45 ms).

## States and actions

`WordState`: language, seed, hard mode, answer, guesses with marks, status, hints, elapsed time.
Environment actions are accepted words; the observation hides the answer until the end. Save
validation regenerates the answer from the seed and replays every guess (words, hard-mode rules
and marks).

## Achievements

| id          | Condition                                |
| ----------- | ---------------------------------------- |
| `first`     | Solve a word.                            |
| `three`     | Solve a word in three guesses or fewer.  |
| `hard`      | Solve a word in hard mode.               |
| `bilingual` | Solve words in both English and Spanish. |
| `streak`    | Solve five words in a row.               |

## Graphics and audio

CSS tiles and keys in the site tokens plus the teal/amber marks; flip, pop and shake animations.
Synthesized key clicks, flips, a rejection buzz, and win/lose phrases.

## Save format and AI interface

Save slot schema 1: `{ state }`. Env `word-guess` v`1.0.0`: kind `puzzle`, one seat, hidden
information, config `{ lang, hard }`; return 1 when solved, score = guesses left + 1.

## Testing criteria

Marking with repeated letters, clean lists in both languages, rejections (length, unknown, both
hard-mode rules), win and loss, the answer always among the candidates and the solver within five
guesses, save validation (wrong answer, tampered marks, unknown word, bad language), hidden
observation, the contract suite; UI: rejection message, marked tiles and keys, solving with hints
with the result recorded, the Spanish keyboard with Ñ, the AI solving a word. E2E desktop + mobile.
