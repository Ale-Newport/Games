# #092 Leduc Poker — Game Specification

Play chips only; no real money. Leduc hold'em is a public-domain research game (Southey et al.,
2005), the standard next step after Kuhn poker.

## Ruleset (`leduc-6card-50chips`)

- Six cards: two jacks, two queens, two kings (shown as spades and hearts). Each hand both players
  ante 1 chip and get one private card; a third card is the public card. The deck is shuffled from
  the match seed and the hand number (`?deal=N` replays a match).
- Round one: the first player (alternating every hand) checks or bets **2**; facing a bet a player
  folds, calls or raises 2; facing a raise, folds or calls (at most a bet and one raise a round;
  after a check, the other may check or bet).
- The public card is turned up; round two is the same with bets of **4**.
- Showdown: a private card that pairs the public card wins; otherwise the higher rank; equal ranks
  split the pot. A fold loses what was put in. A hand moves at most 13 chips.
- A match: both start with 50 chips; after every hand, a player with fewer than 13 chips loses.

## Modes

Play a match against Easy, Medium or Nash (saved after every action, resumable from the menu) or
watch Nash play Medium. Statistics key: the opponent; the score is the length of a won match in
hands (fewer is better).

## Computer players

| Agent    | Play                                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal action.                                                                                                                                                                        |
| `easy`   | Bets only kings before the public card and pairs after it; calls bets with most hands (jacks half the time before the card, 40% after); raises with a pair.                              |
| `medium` | Mixed strategy by strength (rank before the card; pair / king / queen / jack after): bets kings 80% and pairs 90%, raises strong hands, bluffs jacks 10–15%, folds weak hands to raises. |
| `hard`   | **Nash equilibrium** from CFR+ (10 000 iterations over the full tree, 288 information sets, about 63 s offline with `tools/solve-leduc.ts`, stored in `strategy.ts` to 4 decimals).      |

Measured exactly with the solver's strategy evaluation (averaged over both seats, chips per hand):
the equilibrium's value is **−0.0855** for the first player (the published value is about −0.086);
its exploitability is **0.0020**, against 0.683 for Medium and 0.842 for Easy. Nash vs Medium
+0.184, Nash vs Easy +0.144, Medium vs Easy +0.062. Over 100 000 seeded hands: Nash vs Random
+0.702, Nash vs Easy +0.137, Nash vs Medium +0.180, Medium vs Easy +0.061, Easy vs Random +0.785.

The coach ("Show Nash") prints the equilibrium's probability on each of the player's buttons; after
a hand the table shows the probability the opponent's strategy gave each move it made.

## States and actions

`LeducState` = `seed`, `chips`, `handNo`, `first`, `cards` (two private cards and the public card,
0–5: rank ⌊c/2⌋, suit c mod 2), `round`, `betting` (per round), `paid`, `toAct`, `result` (winner
or null for a split, chips won, showdown), `history`, `winner`; validated by replay. Actions:
`check`, `bet`, `call`, `raise`, `fold`, `next`.

## Achievements

| id           | Condition                                            |
| ------------ | ---------------------------------------------------- |
| `first-hand` | Win a hand.                                          |
| `bluff`      | Bet or raise with a jack and make the opponent fold. |
| `trips`      | Win a showdown by pairing the public card.           |
| `big-pot`    | Win 10 chips or more in one hand.                    |
| `match`      | Win a match.                                         |
| `beat-nash`  | Win a match against Nash.                            |

## Controls

Check / Bet, Fold / Call / Raise buttons, Next hand, Show Nash, Menu. Keyboard: C check/call,
B bet, R raise, F fold, H coach, N next hand.

## Graphics and audio

The Kuhn table with a slot for the public card between the players, which turns up for round two;
at a showdown each plate names the hand ("pair of queens", "king high"). Shared poker sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `leduc-poker` v`1.0.0`: two
seats, one hand per episode with player 0 acting first; hidden information (the opponent's card is
−1 until a showdown, the public card until round two); returns in chips (draws on a split); action
space of 5. `exactOracleId: 'hard'`.

## Testing criteria

Rules: bet sizes 2 and 4, the raise cap, the public card and round order, folds, splits, pairs
beating high cards, the end of a match, replay validation. Equilibrium: all 288 information sets
covered, value −0.0855 ± 0.005, exploitability < 0.005; Nash beating Medium and Easy and Medium
beating Easy by exact evaluation; Medium far more exploitable. Contract suite with hidden-card
checks. UI: playing to the public card with the coach. E2E desktop + mobile.
