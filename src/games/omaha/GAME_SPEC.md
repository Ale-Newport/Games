# #089 Omaha Hold'em — Game Specification

Play chips only; no real money, no purchases. "Omaha" is the generic name of the game.

## Ruleset (`omaha-pl-sng-1500`)

- A **sit-and-go** tournament for 2–6 seats (the player and 1–5 AI opponents): every seat starts
  with **1500** chips; the blinds start at 10/20 and rise every **10 hands** (15/30, 25/50, 50/100,
  75/150, 100/200, 150/300, 200/400, 300/600, 500/1000). No antes.
- The button moves to the next seat still in each hand; the next two seats post the small and big
  blinds. **Heads-up the button posts the small blind**, acts first pre-flop and last after the
  flop. A blind larger than a stack puts that player all-in.
- Each hand is dealt from a fresh deck shuffled from the tournament seed and the hand number
  (`?deal=N` replays a tournament's deals). **Four hole cards** each; four betting rounds: pre-flop,
  flop (three cards), turn, river.
- **Pot-limit** betting: fold, check, call, or raise from the minimum (the current bet plus the last
  full raise, at least a big blind) up to the **size of the pot after calling** — the pot including
  every bet on the table plus the call. An all-in raise smaller than a full raise does **not**
  reopen the betting for players who already acted.
- When one player is left the pot is theirs unseen. Otherwise every remaining hand is shown and the
  best five-card hand made of **exactly two** of the player's four hole cards and **exactly
  three** of the five board cards wins (four hearts on the board and one in the hand is no flush) (straight flush, four of a kind, full house, flush,
  straight with the wheel A-2-3-4-5, three of a kind, two pair, pair, high card; kickers count;
  suits never break ties). **Side pots** are layered by the all-in amounts; split pots share
  equally and odd chips go to the first winner left of the button. When at most one player can
  still bet, the board runs out without betting.
- A seat with no chips after a hand is out. The tournament ends when one seat holds all the chips,
  or as soon as the player is out (their finishing place is one more than the seats still in).

## Modes

- **Play**: choose 1–5 opponents and their level (Easy, Medium, Hard). The tournament is saved
  after every action and can be resumed from the menu.
- **Watch AI**: six AI seats (Hard, Medium and Easy styles in turn) play a tournament with all cards
  face up; pause or resume at any time.

Statistics key: the difficulty (`easy`, `medium`, `hard`); a tournament is a win when the player
takes every chip, otherwise a loss. The score is the finishing place (lower is better).

## Computer players

All of them see only their own hole cards, the board and the betting (never the deck or other
hands). Equity is estimated by Monte Carlo: the other contenders are dealt hands and the board is
completed at random, then the hand's share of the pot is compared with the **pot odds**
(call ÷ (pot + call)).

| Agent    | Play                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal action (fold, check, call, min / half-pot / pot raise).                                                                                                                                                                                                                                                                                                                                                                               |
| `easy`   | 60 samples against random hands; calls whenever its equity is within 20 points of the pot odds, raises only with a big edge, never bluffs.                                                                                                                                                                                                                                                                                                      |
| `medium` | 160 samples; **reads ranges**: an opponent who has committed a share _c_ of their chips is only dealt holdings whose strength percentile reaches 0.9·√c (Chen-style pre-flop percentile, or a made hand / flush draw after the flop). Folds below the pot odds; bets or raises 80% of the pot whenever its edge over a fair share reaches 12% (thin value bets are what beat players who call too much); bluffs 2% of the time when checked to. |
| `hard`   | 320 samples with range reading, a small allowance on the button, pot-sized value bets from a 6% edge (bigger with very strong hands), slow-plays a quarter of its monsters, bluffs 4% of the time when checked to.                                                                                                                                                                                                                              |

Range reading uses the best two-card pre-flop percentile among the six pairs in a four-card hand,
and after the flop whether the hand connects with the board (Omaha scoring).

Measured over 1000 seeded heads-up hands per pairing (seats alternate; returns in big blinds per
hand, 1500-chip stacks at 10/20):

| Pairing          | First agent's return | First agent's win rate | Decision time |
| ---------------- | -------------------- | ---------------------- | ------------- |
| Easy vs Random   | +6.45 bb             | 58%                    | 5.3 ms        |
| Medium vs Random | +9.40 bb             | 59%                    | 16.7 ms       |
| Medium vs Easy   | +1.17 bb             | 51%                    | 16.9 ms       |
| Hard vs Easy     | +3.61 bb             | 51%                    | 33.7 ms       |
| Hard vs Medium   | +0.15 bb             | 53%                    | 33.9 ms       |

Omaha equities run close together, so the first tuning (betting from a 25% edge, 6–14% bluffs)
lost to Easy (−0.34 / −0.11 bb per hand); thinner value bets and fewer bluffs fixed it for all the
poker games.

The coach ("Hint") runs the same estimate with range reading (800 samples) and shows the chances,
the pot odds and what a Medium player would do.

## States and actions

`PokerState` = `seed`, `variant`, `seats` (stack, hole, bet this street, total this hand, folded,
all-in, out, pending, capped, drew — draw games only), `button`, `handNo`, `deck`, `dealt`, `board`, `street`
(`preflop` / `flop` / `turn` / `river` / `done`), `toAct`, `currentBet`, `minRaise`, `bets`, `blinds`,
`history`, `result` (chips won per seat, seats shown, showdown scores), `champion`; validated by
replaying the whole tournament from the seed. Actions: `fold`, `check`, `call`, `raise:N` (raise
the street's bet to N), `next` (deal the next hand).

## Achievements

| id          | Condition                                      |
| ----------- | ---------------------------------------------- |
| `first-pot` | Win a pot.                                     |
| `steal`     | Win a pot by raising and making everyone fold. |
| `double-up` | Win an all-in showdown.                        |
| `monster`   | Win a showdown with a full house or better.    |
| `champion`  | Win a sit-and-go tournament.                   |
| `shark`     | Win a full table of five Hard opponents.       |

## Controls

Fold, Check / Call N and Raise (Bet) to N buttons; the raise amount comes from a slider (snapped to
big blinds) up to the pot, or the presets Min, ½ pot and Pot (All-in only when the stack is smaller than the
pot raise). Hint opens the coach; Next hand after a
hand; Menu returns to the setup (with Resume). Keyboard: F fold, C check/call, R raise, A the largest raise (the pot),
←/→ change the raise by a big blind, H hint, N or Enter next hand.

## Graphics and audio

An oval felt table with a wooden rail; seats around it with name plates (stack, dealer button,
the seat to act outlined, winners glowing), four overlapping hole cards (the player's larger), bet chips and the last
action, the board in the middle with empty slots and the pot. Cards are dealt with a short slide
(none with reduced motion); hands shown at showdown are named. Synthesized chip clicks, a knock for
a check, a swish for a fold, a pot sweep, a fanfare for winning a pot or the tournament. On phones
the table is taller so six seats fit.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay; cleared when the tournament ends.
Env `omaha` v`1.0.0`: one pot-limit hand per episode, heads-up by default (config `{ players: 2–6 }`),
1500-chip stacks at 10/20; hidden information (the observation removes the deck and the hole cards
of other seats until they are shown); zero-sum returns in big blinds.

## Testing criteria

Shared poker tests (see Texas Hold'em), including the pot-limit cap. Module tests: wiring; exactly
two hole cards and three board cards (no flush with one suited hole card, a flush with two); the
pot cap as the betting grows (70, then 230) with a larger raise refused; Medium beating Random; the
contract suite (heads-up and six seats). UI tests: heads-up start with four cards, hint, fold, next
hand, resume; pot-limit presets (no All-in, Pot = 60, arrows capped at the pot, A for the largest
raise); Watch AI. E2E desktop + mobile.
