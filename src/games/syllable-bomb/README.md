# #217 Syllable Bomb

The word-bomb party game (generic name; original look), against bots, with a 217,000-word English
dictionary.

| File                          | Role                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `tools/generate-syllables.ts` | Builds `words.txt` and `prompts.ts`                           |
| `words.txt`, `dictionary.ts`  | Webster's Second International (1934, public domain) + modern |
| `engine.ts`                   | Pure rules: prompts, words, fuse, lives, bonus letters        |
| `bots.ts`                     | Bot plans: known words, thinking and typing time              |
| `BombGame.tsx` + CSS          | Lobby, table, bomb, live bot typing, hearts, bonus alphabet   |
| `ai-adapter.ts`               | Environment vs two bots; agents                               |

## Specification

### Ruleset (`syllable-bomb-classic`)

- 2–8 players (you and 1–6 bots; 2–7 bots when watching). Each starts with 2 lives (max 3).
- The bomb shows a 2–3 letter prompt. Its holder must type an unused word of 3+ letters
  containing the prompt that is in the dictionary. A valid word passes the bomb to the next
  living player with a new prompt.
- The fuse is hidden, 10–30 s, and keeps burning across passes. When it runs out, the holder loses
  a life and a new bomb (new fuse, new prompt) starts with the next living player.
- Bonus letters A–V without K (21): using all of them across your words gives back a life (up to 3) and resets them. The last player with lives wins.
- Prompts: easy (in ≥ 2,500 words and ≥ 300 common ones), medium (≥ 600 / 60), hard (≥ 150 / 12),
  or rising (easy, then medium, then a mix of medium and hard).

### Bots

Each bot has a thinking time (1.2–3.4 s), a typing speed (4–10 letters/s) and a vocabulary
breadth: it knows the 4,000–30,000 most frequent words, and only sometimes an obscure one. With
no known word it hesitates while the fuse burns. Wide-vocabulary bots prefer words that add bonus
letters. Their words appear letter by letter.

### Dictionary

All lowercase 3–15 letter words of Webster's Second International (public domain, as shipped in
`/usr/share/dict/web2`) plus the shared modern vocabulary, 217,415 words (2.2 MB, loaded on
demand). **Simplification:** English only (no permissive Spanish dictionary of this size is
available to the project); the interface is bilingual.

### Saves

Lobby settings (schema 1). Games are real-time and not resumed.

### AI interface

The agent (seat 0) vs two bots: `w:<word>` (any valid word; the listed actions are a sample of up
to 300) costs 1.5 s + 0.15 s per letter of fuse, `stall` costs 2 s; reward 1 for outlasting both.
Agents: random and the quick typist (short common words, chasing bonus letters).

### Tests

`tests/game.test.ts` (dictionary and prompt tiers, word checks, passing, fuse, lives, bonus life,
agents, adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/syllable-bomb.spec.ts`.
