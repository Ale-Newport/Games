# #094 Spades — Game Specification

## Ruleset (`spades-partners-nil-500`)

- Four players in two partnerships: the player (south) and north against west and east. Each hand
  deals 13 cards to everyone from a deck shuffled from the game seed and the hand number
  (`?deal=N` replays a game); the deal passes to the left every hand.
- **Bidding**: starting left of the dealer, each player bids 1–13 tricks or **nil** (0). A
  partnership's contract is the sum of its non-nil bids.
- **Play**: the player left of the dealer leads. Follow suit if possible; **spades are always
  trump**; spades may not be led until one has been played, unless the leader holds only spades.
- **Scoring** per partnership: making the contract scores 10 per trick bid plus 1 per overtrick
  (a **bag**); falling short scores −10 per trick bid. A nil scores +100 if its bidder takes no
  trick, −100 otherwise, and a nil bidder's tricks count as bags, never toward the partner's
  contract. Bags carry over; every 10 bags cost 100 points.
- The game ends when a side reaches **500** (the higher score wins; equal scores play on) or falls
  to **−200** (the other side wins).

## Modes

Play with an AI partner against two AI opponents, all at Easy, Medium or Hard (saved after every
action, resumable) or watch four AIs (Hard and Medium partnerships) with every hand face up.
Statistics key: the difficulty; a game is a win or a loss; the score is the side's final score.

## Computer players

They see their own hand, the bids, the cards played and the suits each player has shown out of.

| Agent    | Bidding                                                                                                                                                                                                                                | Play                                                                                                                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any bid.                                                                                                                                                                                                                               | Any legal card.                                                                                                                                                                                                                                                                   |
| `easy`   | Aces and kings plus a third of its spades.                                                                                                                                                                                             | The cheapest card that wins when its side still needs tricks, otherwise its lowest card.                                                                                                                                                                                          |
| `medium` | A trick estimate: side aces (suits up to six cards), kings (two to five), queens (three or four), the top spades, 0.85 per spade beyond three, ruffing with spare spades in short suits. Nil with no high spades and no aces or kings. | Leads aces while tricks are needed, otherwise low from its longest side suit; stays under a winning partner; wins with the cheapest winner when its side needs tricks; ducks with its highest losing card once the contract is made (bags); hides when nil, covers a nil partner. |
| `hard`   | Plays 12 sampled deals of the unseen cards out with Medium and bids its average tricks, shaded down by a quarter.                                                                                                                      | For each legal card, 20 sampled deals consistent with shown-out suits played out by Medium; picks the card with the best average hand score for its side minus the other.                                                                                                         |

Measured with the two agents as the two partnerships (sides swap every game), one hand per game;
the return is the side's hand points minus the other side's, in hundreds:

| Pairing          | Hands | Return | Points a hand | Hands won | Decision time |
| ---------------- | ----- | ------ | ------------- | --------- | ------------- |
| Easy vs Random   | 2000  | +1.834 | +183          | 95%       | < 0.1 ms      |
| Medium vs Random | 2000  | +1.899 | +190          | 96%       | < 0.1 ms      |
| Medium vs Easy   | 2000  | +0.134 | +13           | 55%       | < 0.1 ms      |
| Hard vs Easy     | 300   | +0.277 | +28           | 64%       | 28 ms         |
| Hard vs Medium   | 300   | +0.142 | +14           | 62%       | 27 ms         |

## States and actions

`SpadesState` = `seed`, `handNo`, `dealer`, `scores`, `bags`, `hands`, `phase` (`bid` / `play` /
`done`), `bids`, `trick`, `toAct`, `spadesBroken`, `tricks` (per seat), `played`, `lastTrick`,
`shownOut`, `result` (points, bags, contracts made, nils), `history`, `winner`; validated by replay.
Actions: `bid:0`–`bid:13`, `play:c`, `next`.

## Achievements

| id         | Condition                       |
| ---------- | ------------------------------- |
| `contract` | Make your side's contract.      |
| `set`      | Make the other side fall short. |
| `nil`      | Bid nil and take no trick.      |
| `win-game` | Win a game.                     |
| `win-hard` | Win a game at Hard.             |

## Controls

A grid of bids (Nil, 1–13) — the hint outlines Medium's (or Hard's) bid — then tap a card to play;
cards you may not play are dimmed. Keyboard: 0–9 bid (0 is nil), ←/→ choose a card, Enter play,
H hint, N next hand.

## Graphics and audio

The shared trick table with partnership colours on the name plates (blue for the player's side,
red for the other), each plate showing the bid and tricks won, the partner marked, the dealer
button, and a scoreboard with both scores and bags. Card sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `spades` v`1.0.0`: four seats,
one hand per episode (bidding and play); hidden information (other hands hidden); returns per seat
= (own side's hand points − the other side's) / 100. Evaluation seats the two agents as the two
partnerships, swapping sides every game.

## Testing criteria

Rules: bidding order, the opening lead without spades, contract, bag, set and nil scoring with the
tenth-bag penalty, hands played to 500 or −200, replay validation. Opponents: trick estimates, nil
hands, staying under a winning partner, winning cheaply, sampled deals respecting shown-out suits,
Medium beating Easy and Random. Contract suite (four seats). UI: bidding with the hint, playing a
card, watch mode. E2E desktop + mobile.
