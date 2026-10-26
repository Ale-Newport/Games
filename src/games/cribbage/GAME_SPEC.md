# #097 Cribbage — Game Specification

## Ruleset (`cribbage-6card-121`)

- Two players, six cards each from a deck shuffled from the game seed and the hand number
  (`?deal=N` replays a game); both throw two cards into the dealer's **crib**; the starter is cut
  (a jack gives the dealer 2, "his heels"). The deal alternates.
- **Pegging**: starting with the non-dealer, players lay cards in turn; the count (ace 1, face cards 10) may not pass 31. Points: 2 for 15, 2 for 31, 2 / 6 / 12 for a pair, three or four of a kind at
  the end of the pile, the length of a run among the last cards (in any order). A player who cannot
  play says go automatically; the other plays on while able and the last to play scores 1 for the go
  (none extra at 31); the count restarts with the other player; the last card of the hand scores 1.
- **The show**, in order: the non-dealer's hand, the dealer's hand, the dealer's crib, each with
  the starter: 2 per combination making 15, 2 per pair, every run by its length (double and triple
  runs count each combination), a four-card hand flush 4 (5 with the starter; the crib only a
  five-card flush), the jack of the starter's suit in hand 1 ("nobs").
- The first to **121** wins at once, during pegging or the show. A loser below 91 is skunked
  (shown in the result; no double win).

## Modes

Play against Easy, Medium or Hard (saved after every action, resumable) or watch Hard play Medium
with both hands face up. Statistics key: the difficulty; the score is the winning margin.

## Computer players

They see their own cards, the starter once cut and every card laid.

| Agent    | Throw                                                                                                                                                                                          | Pegging                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `random` | Any two cards.                                                                                                                                                                                 | Any playable card.                                                                            |
| `easy`   | Its two highest cards.                                                                                                                                                                         | Its lowest playable card.                                                                     |
| `medium` | Keeps the four cards that score best without a starter, plus a crib estimate for the thrown pair (fives, pairs, fifteens, neighbours) — added for its own crib, subtracted for the opponent's. | The most points now; avoids leaving 5 or 21 (a ten makes 15 or 31); leads low.                |
| `hard`   | Keeps the four cards with the best average show over all 46 possible starters, with the same crib estimate.                                                                                    | Points now minus four times the opponent's average best reply over the cards it has not seen. |

Measured over 5000 seeded hands per pairing (seats alternating; one hand per game; returns in tens
of points — the hand's points minus the opponent's):

| Pairing          | Return | Points a hand | Hands won | Decision time |
| ---------------- | ------ | ------------- | --------- | ------------- |
| Easy vs Random   | +0.119 | +1.2          | 53%       | < 0.1 ms      |
| Medium vs Random | +0.428 | +4.3          | 65%       | < 0.1 ms      |
| Medium vs Easy   | +0.303 | +3.0          | 60%       | < 0.1 ms      |
| Hard vs Easy     | +0.370 | +3.7          | 63%       | 0.2 ms        |
| Hard vs Medium   | +0.070 | +0.7          | 50%       | 0.2 ms        |

## States and actions

`CribbageState` = `seed`, `handNo`, `dealer`, `scores`, `hands`, `kept`, `crib`, `cut` (the card to
be cut, hidden), `starter`, `phase` (`crib` / `peg` / `show` / `done`), `toAct`, `pile`, `played`,
`events` (the latest points: who, how many, why), `show` (the three breakdowns), `history`,
`winner`; validated by replay. Actions: `crib:a.b`, `play:c`, `next`.

## Achievements

| id           | Condition                       |
| ------------ | ------------------------------- |
| `thirty-one` | Peg 31 exactly.                 |
| `pair-royal` | Peg 6 or more with one card.    |
| `big-hand`   | Score 16 or more in a hand.     |
| `match`      | Win a game.                     |
| `skunk`      | Win with the opponent below 91. |
| `match-hard` | Win a game against Hard.        |

## Controls

Tap two cards and press Throw to the crib; then tap a card to lay it (cards that would pass 31 are
dimmed). Keyboard: ←/→ choose, Enter pick or play, T throw, H hint, N next hand.

## Graphics and audio

A two-lane peg board (a tick every five holes) with each player's peg; a green table with the
opponent's cards (backs), the starter, the current pile and the count, a log of the plays since the
player's last card ("Opponent: 5♣ → 31 (+2)") and the latest points; at the show the three hands
with their breakdown (15s, pairs, runs, flush, nobs). Card and chip sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `cribbage` v`1.0.0`: two
seats, one hand per episode (throw, pegging and show); hidden information (the other hand, the cut
card and the crib are hidden until the show); returns = (own points − the other's) / 10.

## Testing criteria

Scoring: the 29 hand; double runs; four- and five-card flushes and the crib flush rule; pegging
fifteens, 31, pairs, pair royals and runs in any order. Rules: the throw, the starter, legal plays
never passing 31, eight cards laid, the show matching the scorer, a game to 121 with replay
validation. AI: the crib estimate, pegging the fifteen. Contract suite. UI: the throw with the hint,
the play log. E2E desktop + mobile.
