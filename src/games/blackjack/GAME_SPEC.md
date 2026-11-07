# #086 Blackjack — Game Specification

Play chips only; no real money, no purchases.

## Ruleset (`blackjack-6d-s17-das`)

- A six-deck shoe shuffled from a seed (each new shoe from the seed and its number; `?deal=N`
  replays a session's shoes); it is reshuffled before a round once 75% has been dealt.
- Bets of 10, 25, 50, 100, 250 or 500 chips; the session starts with 1000 and is refilled to 1000
  when it falls below the smallest bet (counted).
- Cards: face cards 10, aces 1 or 11. Deal: player, dealer up card, player, dealer hole card.
- **Insurance** is offered when the dealer shows an ace (half the bet, pays 2 to 1). With an ace or
  a ten-value card up, the dealer **peeks**: a dealer blackjack settles the round at once.
- A player **blackjack** (two-card 21, not after a split) pays **3 to 2**; against a dealer
  blackjack it pushes.
- Player actions: **hit**, **stand**, **double** (any first two cards, also after a split; one more
  card), **split** pairs of equal value up to four hands (split aces get one card each and are not
  split again). No surrender.
- The dealer draws to 17 and **stands on soft 17**; wins pay 1 to 1, pushes return the bet.

## Modes

Play (chips persist in the save, with a basic-strategy hint) and Watch AI (basic strategy plays with
25-chip bets). Statistics key `blackjack`: each round is a win, loss or draw by its net result; the
best score is the highest bankroll.

## Computer players

| Agent    | Play                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal action.                                                                                                            |
| `mimic`  | Plays like the dealer: hits below 17, never doubles, splits or insures.                                                      |
| `basic`  | Textbook basic strategy for these rules from the player's cards and the up card; never insures. Used for hints and Watch AI. |

Measured over 200 000 seeded rounds (bet 10): basic strategy **−0.14%** per round (the theoretical
house edge for these rules is about 0.4%; within the sampling error), the dealer mimic −5.50%, the
random player −42.5%.

## States and actions

`BlackjackState` = `seed`, `shoeNumber`, `shoe`, `dealt`, `bankroll`, `phase`
(`bet` / `insurance` / `play` / `settled`), `hands` (cards, bet, doubled, done, fromSplit, outcome,
payout), `active`, `dealer`, `revealed`, `insurance`, `history`, `rounds`, `refills`; validated by
replaying the whole session. Actions: `bet:25`, `insure`, `no-insure`, `hit`, `stand`, `double`,
`split`, `next`.

## Achievements

| id            | Condition                   |
| ------------- | --------------------------- |
| `natural`     | Get a blackjack.            |
| `double-down` | Win a doubled hand.         |
| `split-sweep` | Win every hand of a split.  |
| `hot-streak`  | Win five rounds in a row.   |
| `high-roller` | Double your starting chips. |

## Controls

Tap a chip to bet and deal; Hit, Stand, Double and Split buttons (unavailable actions are disabled),
Insurance / No insurance, Next round. "Hint" outlines the basic-strategy move. Keyboard: 1–6 bet,
H hit, S stand, D double, P split, I insurance, N no insurance / next, B hint.

## Graphics and audio

A green felt table with a gold rim, the shared card art dealt with a short slide (none with reduced
motion), the hole card face down until revealed, hand totals (soft totals as "7/17"), the active hand
outlined, colored chips, outcome labels. Card sounds, a fanfare for a winning round and a low tone
for a losing one.

## Save format and AI interface

Save slot schema 1: `{ state, streak }`, validated by replay. Env `blackjack` v`1.0.0`: one seat,
one round per episode with a 10-chip bet placed at creation; hidden information (the shoe and the
hole card are removed from the observation); the return is the round's net result in bets
(−2 … +3).

## Testing criteria

Hand values; a natural paid 3 to 2 (shoe 21); the dealer's peek (shoe 6) and two naturals pushing
(shoe 210); insurance (shoe 12); doubling on 11 (shoe 25); splitting aces (shoe 3, 21 after a split
is not a blackjack); the dealer drawing to 17; refills and session replay validation; the basic
strategy chart; basic strategy beating the dealer mimic over 20 000 rounds; the contract suite; UI
(chip bet, hint, double, statistics, next; a natural with its achievement; insurance by keys); e2e
desktop + mobile.
