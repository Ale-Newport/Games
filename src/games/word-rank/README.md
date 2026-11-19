# #206 Word Rank

A daily word-meaning game in the style of the viral "rank by context" games (generic name;
original word list, look and texts): every guess is ranked by how close it is in meaning to the
secret word, among 30,000 English or 30,000 Spanish words. Uses the shared semantic module (`../shared/semantic/`),
also used by #207 and #215.

| File                                                | Role                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `../shared/semantic/semantic.ts`                    | Vector loading, cosine similarity, full rankings, plural folding |
| `../shared/semantic/words.txt`, `vectors.bin`       | 30,000 English words × 160 int8 dimensions (built from GloVe)    |
| `../shared/semantic/words-es.txt`, `vectors-es.bin` | 30,000 Spanish words × 160 int8 dimensions (built from fastText) |
| `secrets.ts`                                        | 332 English and 317 Spanish secret words (concrete nouns)        |
| `engine.ts`                                         | Pure rules: guesses, ranks, hints, give up, daily numbering      |
| `ai.ts`, `ai-adapter.ts`                            | Meaning-climber agents; `GameEnvironment` (vectors loaded first) |
| `WordRankGame.tsx` + CSS                            | Menu, guess list with closeness bars, hints, end screen, share   |

## Specification

### Ruleset (`word-rank-30k`)

- The game's language is the interface language when a game starts (a game in progress keeps
  its own). English: the 30,000 most frequent alphabetic GloVe words after folding plurals into
  their singulars (`training/scripts/build_semantic.py`). Spanish: the 30,000 most frequent
  Spanish fastText words, with English web words, brands and markup filtered out and plurals
  folded (`training/scripts/build_semantic_es.py`). Rank 1 is the secret; every other word is
  ranked by cosine similarity to it (ties by frequency).
- A guess must be a vocabulary word (case and accents ignored; "dogs" counts as "dog";
  in Spanish "arboles" counts as "árbol", while ñ is a letter of its own: "año" ≠ "ano"). Unknown
  words and repeats do not count.
- Colours: rank ≤ 300 green, ≤ 1,500 yellow, else red. The list is sorted by rank with the latest
  guess pinned on top; bars show closeness on a log scale.
- **Hint**: the unguessed word at half the best rank so far (rank 300 with no guesses), never
  the secret. **Give up** ends the game and shows the 100 closest words. The game also ends after
  500 guesses.

### Modes

Today's game (numbered from 1 January 2026; the secret list is shuffled once with a fixed seed),
past games by number, random words (`?deal=N`), Watch the AI. Unfinished games resume. Each
language has its own daily series and secret list.

### Model and simplifications

Meaning comes from GloVe 6B 300-d vectors (Stanford NLP, Public Domain Dedication and License),
reduced to 160 dimensions with PCA (83% of variance) and quantized to int8, about 5 MB loaded on
first play. Spanish meaning comes from the fastText Common Crawl Spanish vectors (Grave et al.
2018, CC BY-SA 3.0; the derived `words-es.txt`/`vectors-es.bin` keep that license), reduced the
same way (82% of variance). **Simplification:** the original game ranks lemmas with its own
model; here verb forms and adjectives are separate words, and only plurals fold.

### Save format

`saveSlot` schema 1: `{ state, daily: { gameNo: guesses (negative if given up) } }`.

### AI interface

Config `{ secret?, limit? }`. Actions `g:<word index>`, `hint`, `give-up`. Reward on finding the
word: 1 / (1 + log10(guesses + 5 × hints)). Agents: random, meaning climber (guesses the closest
unguessed neighbours of its best guesses), climber with hints (also takes a hint every 12 guesses
while far). The climber finds most words within 300 guesses in tests.

### Tests

`../shared/semantic/tests/semantic.test.ts` (vectors, neighbours, plurals), `tests/game.test.ts`
(secrets in vocabulary, ranks, repeats, unknown words, hints, daily numbering, climber success,
adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/word-rank.spec.ts`.
