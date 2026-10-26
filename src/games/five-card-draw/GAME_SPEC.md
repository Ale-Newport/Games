# #088 Five Card Draw Poker — Game Specification

Play chips only; no real money, no purchases. "Five Card Draw" is the generic name of the game.

## Ruleset (`draw5-fl-sng-1500`)

- A **sit-and-go** tournament for 2–6 seats (the player and 1–5 AI opponents), 1500 chips each,
  blinds from 10/20 rising every 10 hands (the same levels as Texas Hold'em), no antes.
- The button moves to the next seat still in; the next two seats post the small and big blinds
  (heads-up the button posts the small blind and acts first before the draw).
- Each hand is dealt from a deck shuffled from the tournament seed and the hand number (`?deal=N`
  replays a tournament's deals). Everyone gets **five cards face down**.
- **Betting before the draw**, starting left of the big blind.
- **The draw**: starting left of the button, every player still in (all-in players too) throws
  away **0–3 cards** and is dealt as many from the deck; the number of cards each player takes is
  public. Six players drawing three each use 48 cards, so the deck never runs out.
- **Betting after the draw**, starting left of the button, then the showdown: the best five-card
  hand wins (straight flush, four of a kind, full house, flush, straight with the wheel, three of a
  kind, two pair, pair, high card; kickers count; suits never break ties).
- **Fixed limit**: bets and raises are exactly one big blind before the draw and two after it; at
  most **four bets** a round (the blind counts as the first before the draw). A player short of a
  full bet may go all-in for less; that does not reopen the betting for players who already acted.
- Side pots, split pots and odd chips as in Texas Hold'em; when at most one player can still bet,
  the remaining players still draw and then show down. Eliminations and the end of the tournament
  as in Texas Hold'em.

## Modes

Play (1–5 opponents, Easy / Medium / Hard; saved after every action, resumable from the menu) and
Watch AI (six AI seats, all cards face up). Statistics key: the difficulty; a tournament is a win
when the player takes every chip; the score is the finishing place (lower is better).

## Computer players

They see only their own cards, the betting and how many cards each opponent drew.

| Agent    | Play                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal action (any of the 26 draws).                                                                                                                                                                                                                                                                                                                                                                              |
| `easy`   | Draws by a simple rule (keep pairs and better and made straights or flushes, draw one to four to a flush or a straight, otherwise keep the two highest cards); bets with Monte Carlo equity against random hands and calls far too much.                                                                                                                                                                             |
| `medium` | Chooses its draw by Monte Carlo over all 26 options, scored on the same samples of the opponents' final hands (hands that fit the number of cards they took, or the simple rule if they have not drawn yet). Equity samples opponents the same way and reads ranges from the chips they committed; in fixed limit it value-bets thinner (half the edge needed in big-bet games), rarely bluffs and never slow-plays. |
| `hard`   | As Medium with twice the samples, slightly thinner value bets, a few more bluffs and a small allowance on the button.                                                                                                                                                                                                                                                                                                |

Measured over 2000 seeded heads-up hands per pairing (seats alternate; returns in big blinds per
hand): Easy vs Random +1.45, Medium vs Random +1.34, **Medium vs Easy +0.14**, **Hard vs Easy
+0.12**, Hard vs Medium +0.02 (the two are level within the sampling error). Fixed-limit edges are
small: the bets are small next to the pot, so most decisions are close. On 3000 random deals the
Monte Carlo discard wins 48.5% of showdowns against an opponent drawing by the simple rule, the same
as the simple rule itself (48.7%): the rule is close to optimal heads-up, and the Monte Carlo choice
adapts when the opponents' draws are known.

The coach ("Hint") shows the Medium player's discard during the draw and, when betting, the
chances (with range reading), the pot odds and the Medium player's move.

## States and actions

The shared `PokerState` (see Texas Hold'em) with `variant: 'draw'`, streets `preflop` (before the
draw) / `draw` / `final` / `done`, `bets` (bets made this round, for the cap) and each seat's `drew`
(−1 before the draw). Actions: `fold`, `check`, `call`, `raise:N`, `draw:` (stand pat) /
`draw:024` (throw away the cards at positions 0, 2 and 4), `next`.

## Achievements

| id          | Condition                                      |
| ----------- | ---------------------------------------------- |
| `first-pot` | Win a pot.                                     |
| `steal`     | Win a pot by raising and making everyone fold. |
| `pat-hand`  | Win a showdown without drawing a card.         |
| `double-up` | Win an all-in showdown.                        |
| `monster`   | Win a showdown with a full house or better.    |
| `champion`  | Win a sit-and-go tournament.                   |
| `shark`     | Win a full table of five Hard opponents.       |

## Controls

Fold, Check / Call N and Bet / Raise to N buttons (one size in fixed limit, so no slider). In the
draw, tap your cards to throw them away (they lift; at most three), then Draw N or Stand pat. Hint,
Next hand, Menu. Keyboard: F fold, C check/call, R raise, 1–5 pick cards, D or Enter draw, H hint,
N next hand.

## Graphics and audio

The Texas Hold'em table without community cards: the round ("Before the draw", "The draw", "After
the draw") above the pot, five overlapping cards per seat, the player's cards lifting when picked,
each plate showing how many cards the seat drew ("drew 2", "stood pat"). Sounds as in Texas
Hold'em, with a deal sound for draws.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `five-card-draw` v`1.0.0`:
one fixed-limit hand per episode, heads-up by default (config `{ players: 2–6 }`); hidden
information (the deck and the other seats' cards are removed from the observation; draw counts
stay); zero-sum returns in big blinds.

## Testing criteria

Engine: five cards dealt; one-big-blind bets and the four-bet cap; the draw order, legal draws (at
most three, increasing positions), replaced cards and public counts; two-big-blind bets after the
draw; an all-in player still drawing; random tournaments replayed. Module: wiring; simple discards
(pair, four-flush, pat straight, ace-low four-straight); Medium keeping trips; Medium betting a pat
full house; Medium beating Random; the contract suite (heads-up and six seats). UI: fixed-limit
controls without a slider, picking discards by tap and key, the coach, the draw count. E2E desktop

- mobile.
