# #090 Seven Card Stud — Game Specification

Play chips only; no real money, no purchases. "Seven Card Stud" is the generic name of the game.

## Ruleset (`stud7-fl-sng-1500`)

- A **sit-and-go** tournament for 2–6 seats (the player and 1–5 AI opponents), 1500 chips each.
  The stakes rise every 10 hands with the shared levels: at level _b_/_B_ (10/20 first) the ante is
  _B_/10 (at least 1), the bring-in _b_ and the bets _B_ (small) and 2·_B_ (big).
- Each hand is dealt from a deck shuffled from the tournament seed and the hand number (`?deal=N`
  replays a tournament's deals). Everyone posts the **ante** (dead money, not part of a bet).
- **Third street**: two cards face down and one face up to everyone. The lowest up card (deuce
  lowest, ace highest; ties by suit: clubs, diamonds, hearts, spades) posts the **bring-in**. Action
  starts on its left: call the bring-in, **complete** to a small bet, or fold; then raises of a small
  bet. If everyone just calls, the bring-in has no further option.
- **Fourth, fifth and sixth street**: one more card face up; **seventh street**: one face down.
  From fourth street on, the **best showing hand** (pairs, two pair, trips, quads by rank, then high
  cards; ties to the first seat left of the dealer button) acts first.
- **Fixed limit**: small bets on third and fourth street, big bets from fifth; at most four bets a
  street (the completion counts; the bring-in does not). A short all-in does not reopen the
  betting. Simplification: no optional big bet on an open pair on fourth street.
- Showdown: the best five of each player's seven cards (straight flush, four of a kind, full house,
  flush, straight with the wheel, three of a kind, two pair, pair, high card). Side pots, split
  pots, odd chips, eliminations and the end of the tournament as in Texas Hold'em; when at most one
  player can still bet, the remaining cards are dealt without betting. Six players use at most 42
  cards.

## Modes

Play (1–5 opponents, Easy / Medium / Hard; saved after every action, resumable from the menu) and
Watch AI (six AI seats, all cards face up). Statistics key: the difficulty; a tournament is a win
when the player takes every chip; the score is the finishing place (lower is better).

## Computer players

They see their own cards, every face-up card at the table and the betting. Equity is estimated by
Monte Carlo: the visible cards leave the deck, each opponent still in is dealt its hidden cards and
every hand is completed to seven cards.

| Agent    | Play                                                                                                                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal action.                                                                                                                                                                                                                                                                 |
| `easy`   | 60 samples, opponents' hidden cards at random; calls whenever its equity is within 20 points of the pot odds, raises only with a big edge, never bluffs.                                                                                                                          |
| `medium` | 160 samples; reads ranges (an opponent who committed a share _c_ of their chips beyond the ante and bring-in is dealt hidden cards that make its hand at least 0.9·√c strong). Bets or completes from a 12% edge, calls with 2 points over the pot odds, bluffs 0.5% of the time. |
| `hard`   | As Medium with 320 samples and 1% bluffs (no position allowance: in stud the order changes every street).                                                                                                                                                                         |

Measured over 2000 seeded heads-up hands per pairing (seats alternate; returns in units of the
first small bet, 20 chips, per hand): Easy vs Random +0.69, Medium vs Random +1.24, **Medium vs
Easy +0.62**, **Hard vs Easy +0.61**, Hard vs Medium −0.07 (level within the sampling error).
Tuning notes: Hard first lost to Medium by 0.14 per hand — a button allowance meaningless in stud,
thinner value bets and looser calls; in fixed limit both now share the betting and calling
thresholds and Hard keeps its extra samples.

The coach ("Hint") runs the same estimate (800 samples, with range reading) and shows the chances,
the pot odds and the Medium player's move.

## States and actions

The shared `PokerState` (see Texas Hold'em) with `variant: 'stud'`, streets `third` … `seventh` /
`done`, each seat's `hole` growing from three to seven cards (positions 2–5 face up, 0, 1 and 6 face
down) and `bets` for the cap. Actions: `fold`, `check`, `call`, `raise:N` (a bet, a completion or a
raise to N), `next`.

## Achievements

| id          | Condition                                           |
| ----------- | --------------------------------------------------- |
| `first-pot` | Win a pot.                                          |
| `steal`     | Win a pot by raising and making everyone fold.      |
| `rolled-up` | Be dealt three of a kind in your first three cards. |
| `double-up` | Win an all-in showdown.                             |
| `monster`   | Win a showdown with a full house or better.         |
| `champion`  | Win a sit-and-go tournament.                        |
| `shark`     | Win a full table of five Hard opponents.            |

## Controls

Fold, Check / Call N and Bet / Complete / Raise to N buttons (one size in fixed limit). Hint, Next
hand, Menu. Keyboard: F fold, C check/call, R bet/complete/raise, H hint, N next hand.

## Graphics and audio

The shared poker table without community cards: the street ("Third street" … "Seventh street")
above the pot, the stakes in the header (ante, bring-in, bets), seven overlapping cards per seat —
opponents' down cards face down, everyone's up cards face up — and the player's own down cards set
lower and dimmer (announced as "face down, only you see it"). Sounds as in Texas Hold'em.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `seven-card-stud` v`1.0.0`:
one fixed-limit hand per episode, heads-up by default (config `{ players: 2–6 }`); hidden
information (the observation removes the deck and the other seats' down cards; up cards stay);
zero-sum returns in units of 20 chips.

## Testing criteria

Engine: antes and the bring-in from the lowest up card (suit ties); call or complete; small then
big bets from fifth street; the best showing hand opening fourth street; up cards visible and down
cards hidden in observations; seven cards at every showdown, chip conservation and replay
validation over a random tournament. Module: wiring and masking; equity falling when the case aces
show elsewhere; Medium completing rolled-up trips; Medium beating Random; the contract suite
(heads-up and six seats). UI: the stakes line, hidden and own-down cards, play to fourth street, the
completion button. E2E desktop + mobile.
