# #096 Gin Rummy — Game Specification

## Ruleset (`gin-knock10-100`)

- Two players, ten cards each from a deck shuffled from the match seed and the hand number
  (`?deal=N` replays a match); the next card starts the discard pile; the non-dealer plays first.
- **Melds**: sets of three or four cards of a rank; runs of three or more consecutive cards of a
  suit (ace low, no wrap). **Deadwood**: the cards outside the melds, counted ace 1, number cards
  at face value, face cards 10 — always for the arrangement that leaves the least.
- A turn: draw the top card of the stock or of the discard pile, then throw one card (not the card
  just taken from the pile). A player whose deadwood after the throw is 10 or less may **knock**
  instead of an ordinary throw.
- **Gin** (no deadwood): 25 plus the opponent's deadwood; no lay-offs. **Knock**: the defender lays
  off deadwood cards that extend the knocker's melds; the knocker scores the difference in deadwood,
  unless the defender's is equal or lower — an **undercut**: the defender scores 25 plus the
  difference.
- When two cards are left in the stock after a throw and nobody has knocked, the hand is void.
- The loser of a hand deals the next (the same dealer after a void hand). The first to **100**
  wins the match. Simplifications: no first-turn upcard refusal, no big gin, no box bonuses.

## Modes

Play a match against Easy, Medium or Hard (saved after every action, resumable) or watch Hard play
Medium with both hands face up. Statistics key: the difficulty; the score is the winning margin.

## Computer players

They see their hand, the discard pile, and which cards the opponent took from the pile or threw.

| Agent    | Play                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal draw, throw or knock.                                                                                                                                                                                                                                                                                                                                           |
| `easy`   | Takes the discard only when it lowers its deadwood; throws its highest deadwood card; knocks as soon as it may.                                                                                                                                                                                                                                                           |
| `medium` | Takes the discard when it joins a meld and lowers the deadwood; throws the card that leaves the least deadwood, with a penalty for cards of a rank or suit neighbourhood the opponent has picked up; knocks with 7 or less (any legal knock once fewer than 14 cards are in the stock).                                                                                   |
| `hard`   | Draws like Medium; rates each throw by the deadwood it expects after its next draw (averaged over the unseen cards, sampled to 24) plus the same danger; before knocking samples 30 possible opponent hands (with the cards they picked up) and lays off to estimate the undercut risk — knocks below 20% (35% with 4 or less, always once the stock runs low or at gin). |

Measured over seeded hands with the seats alternating (one hand per game; returns in units of 25
points; "hands won" counts the hands that scored for the first agent):

| Pairing          | Hands | Return | Points a hand | Hands won | Decision time |
| ---------------- | ----- | ------ | ------------- | --------- | ------------- |
| Easy vs Random   | 2000  | +1.933 | +48           | 99%       | < 0.1 ms      |
| Medium vs Random | 2000  | +2.037 | +51           | 96%       | < 0.1 ms      |
| Medium vs Easy   | 2000  | +0.060 | +1.5          | 46%       | < 0.1 ms      |
| Hard vs Easy     | 1000  | +0.170 | +4.3          | 59%       | 3.3 ms        |
| Hard vs Medium   | 1000  | +0.069 | +1.7          | 61%       | 3.3 ms        |

(Easy knocks at once and wins more hands than Medium, but smaller ones; Medium's waits for better
knocks and gin pay a little more per hand.)

## States and actions

`GinState` = `seed`, `handNo`, `dealer`, `scores`, `hands`, `stock`, `discard`, `phase` (`draw` /
`discard` / `done`), `toAct`, `takenFromDiscard`, `picks` and `thrown` (public), `result` (kind,
knocker, winner, points, melds, deadwood, counts after lay-offs, cards laid off), `history`,
`winner`; validated by replay. Actions: `draw:stock`, `draw:discard`, `discard:c`, `knock:c`,
`next`.

## Achievements

| id           | Condition                 |
| ------------ | ------------------------- |
| `knock`      | Win a hand by knocking.   |
| `gin`        | Go gin.                   |
| `undercut`   | Undercut a knock.         |
| `match`      | Win a match to 100.       |
| `match-hard` | Win a match against Hard. |

## Controls

Tap the stock or the discard pile to draw (both outlined when it is your draw); tap a card (it
lifts) and press Discard, or Knock / Gin when the throw allows it. Your hand is laid out as its melds
(outlined) followed by the deadwood, with the deadwood count below. Keyboard: S stock, D discard
pile, ←/→ choose a card, Enter throw, K knock, H hint, N next hand.

## Graphics and audio

A green table: the opponent's hand as card backs (with the cards they took from the pile listed),
the stock with its count and the discard pile in the middle, the player's melds in outlined groups
and the loose cards after them; at the end of a hand both hands are shown with melds, the deadwood
counts and the cards laid off. Card sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `gin-rummy` v`1.0.0`: two
seats, one hand per episode; hidden information (the stock and the other hand are hidden until the
hand ends; picks and throws are public); returns ± points / 25 (0 for a void hand).

## Testing criteria

Melds: sets, runs, the least-deadwood arrangement when melds overlap, no K-A wrap, extending melds,
lay-offs. Rules: the deal, the first draw, not throwing back the pile card, gin (25 + deadwood),
an undercut (25 + difference), a void hand, a match to 100 with replay validation. AI: the undercut
risk and Hard's legal choices. Contract suite. UI: drawing, the hint selecting a card, throwing,
the opponent's turn. E2E desktop + mobile.
