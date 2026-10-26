# #093 Hearts — Game Specification

## Ruleset (`hearts-4p-pass3-100`)

- Four players, each for themselves; seats clockwise: the player (south), west, north, east. Each
  hand deals all 52 cards from a deck shuffled from the game seed and the hand number (`?deal=N`
  replays a game).
- **Passing**: three cards to the left, then to the right, then across, then no pass; the cycle
  repeats. Every seat picks its cards before any are exchanged.
- The holder of the **two of clubs** leads it to the first trick. Players must follow the led suit
  if they can; the highest card of the led suit wins and its taker leads next.
- No hearts and no queen of spades on the first trick, unless a player has nothing else. Hearts may
  not be led until a heart has been played ("broken"), unless the leader holds only hearts.
- Points: each heart 1, the **queen of spades 13** (26 a hand). **Shooting the moon**: a player who
  takes all 26 scores 0 and every other player scores 26.
- The game ends when someone reaches **100** at the end of a hand: the lowest score wins; a tie for
  the lowest plays another hand.

## Modes

Play against three opponents at Easy, Medium or Hard (saved after every action, resumable from
the menu) or watch four AIs (Hard, Medium, Hard, Medium) with every hand face up. Statistics key:
the difficulty; a game is a win or a loss; the score is the player's final score (lower is better).

## Computer players

They see their own hand, the cards played, the suits each player has shown out of (public) and the
cards they passed.

| Agent    | Play                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal card, any three cards to pass.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `easy`   | Plays its lowest legal card (its highest when void), passes its three highest.                                                                                                                                                                                                                                                                                                                                                                     |
| `medium` | Passes the queen and the ace and king of spades (with fewer than five spades), high hearts, then tries to void a minor suit. Leads low spades to flush out the queen, otherwise low from its shortest safe suit; ducks under the winning card with its highest lower card; drops the queen on a trick an ace or king of spades is winning; when void, dumps the queen, then the ace/king of spades while the queen is out, then its highest heart. |
| `hard`   | Passes like Medium. For each legal card, samples 24 deals of the unseen cards consistent with its knowledge (hand sizes, suits shown out of — the most constrained cards are dealt first — and the cards it passed), plays the hand out with Medium for everyone, and picks the card with the lowest average points relative to the others (common samples for every option).                                                                      |

Measured with the two agents in alternate seats (A B A B, then B A B A), one hand per game; the
return is a seat's (others' average − own) / 26, averaged over its seats:

| Pairing          | Hands | Return | Points saved a hand | Wins | Decision time |
| ---------------- | ----- | ------ | ------------------- | ---- | ------------- |
| Easy vs Random   | 1000  | +0.193 | ≈ 5.0               | 82%  | < 0.1 ms      |
| Medium vs Random | 1000  | +0.249 | ≈ 6.5               | 90%  | < 0.1 ms      |
| Medium vs Easy   | 1000  | +0.040 | ≈ 1.0               | 57%  | < 0.1 ms      |
| Hard vs Easy     | 200   | +0.114 | ≈ 3.0               | 73%  | 48 ms         |
| Hard vs Medium   | 200   | +0.078 | ≈ 2.0               | 63%  | 49 ms         |

("Points saved" is the return × 26: how many fewer points than the opponents' average.)

The hint shows a good pass (and picks it) or Hard's card.

## States and actions

`HeartsState` = `seed`, `handNo`, `scores`, `hands`, `phase` (`pass` / `play` / `done`), `passes`,
`received`, `trick`, `toAct`, `heartsBroken`, `shownOut`, `taken`, `tricks`, `lastTrick`,
`handPoints`, `moon`, `history`, `winner`; validated by replay. Actions: `pass:c1.c2.c3` (seats in
turn from the player), `play:c`, `next`.

## Achievements

| id           | Condition                                               |
| ------------ | ------------------------------------------------------- |
| `clean-hand` | Finish a hand without a point.                          |
| `queen-dump` | Play the queen of spades on a trick someone else takes. |
| `moon`       | Take all 26 points in a hand.                           |
| `win-game`   | Win a game.                                             |
| `win-hard`   | Win a game against Hard opponents.                      |

## Controls

Tap three cards (they lift) and press Pass; then tap a card to play — the cards you may not play
are dimmed. Hint; Next hand; Menu. Keyboard: ←/→ choose a card, Enter plays or picks it, P passes,
H hint, N next hand.

## Graphics and audio

A green table with the three opponents' hands as fans of card backs (face up when watching), name
plates with the score and the points taken this hand, the current trick in the middle with each card
pushed toward its player and the taker's card glowing for a moment, the player's hand fanned along
the bottom (received cards outlined on the first trick). Card and chip sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `hearts` v`1.0.0`: four seats,
one hand per episode (pass to the left); hidden information (the observation hides the other hands,
passes and received cards); legal actions list the 286 three-card passes; returns per seat
((others' average points − own) / 26, summing to zero). Evaluation seats two agents alternately.

## Testing criteria

Rules: the deal, passing to the left and the received cards, the two of clubs, no points on the
first trick, hearts not led before broken, hand scoring (26 points, or 78 after a moon), the end of
the game at 100 with the lowest winning, replay validation. Opponents: passing the queen, ducking,
dumping the queen when void, sampled deals respecting hand sizes and shown-out suits, Medium beating
Easy and Random. Contract suite (four seats, hidden hands). UI: passing with the hint, playing legal
cards, watch mode. E2E desktop + mobile.
