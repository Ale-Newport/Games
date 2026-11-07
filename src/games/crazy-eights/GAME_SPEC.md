# #099 Crazy Eights — Game Specification

## Ruleset (`eights-draw1-100`)

- 2–4 players (the player and 1–3 AI opponents); seven cards each with two players, five with three
  or four, from a deck shuffled from the game seed and the hand number (`?deal=N` replays a game);
  the next card starts the pile and sets the suit. The deal passes to the left.
- A turn: play a card of the current suit or of the top card's rank, or an **eight** (wild: name the
  next suit). With nothing to play, draw one card; it may be played if it fits, otherwise pass.
  When the stock is empty the pile (all but its top card) is reshuffled from the seed into a new
  stock; with nothing to draw, a player who cannot play passes.
- Going out scores the cards left in the other hands: eight 50, face cards 10, ace 1, others their
  value. If every player passes in a row with nothing to draw, the hand is **blocked**: the lowest
  hand scores the difference to each other hand.
- The first to **100** wins (the highest score if several pass it in the same hand).

## Modes

Play against 1–3 opponents at Easy, Medium or Hard (saved after every action, resumable) or watch
four AIs (Hard, Medium, Easy, Hard) with every hand face up. Statistics key: the difficulty; the
score is the player's final score.

## Computer players

They see their own hand, the pile, the hand sizes and the suit each player could not follow at
their latest draw (public: a player who draws had nothing of the suit and no eight).

| Agent    | Play                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal move.                                                                                                                                                                                                                       |
| `easy`   | The first playable card other than an eight; an eight names its most common suit; plays a drawn card when it can.                                                                                                                     |
| `medium` | Plays from its longest suit, shedding high cards first; keeps eights until it has nothing else or can go out; names its longest suit — or, when an opponent has two cards or fewer, a suit that player could not follow and it holds. |
| `hard`   | Medium plus pressure on the next player: keeps play on (or switches to, by rank) the suit that player could not follow at their latest draw, and names that suit with its eights.                                                     |

An earlier Hard played each option out over 16–48 sampled deals with Medium for everyone: it lost
to Medium (−4.3 and, with a margin to stay with Medium's move, −0.7 points a hand), because the
draws decide too much for short playouts — so the rules above replaced it.

Measured over 10 000 seeded two-player hands per pairing (seats alternating; returns in tens of
points: the winner's points, minus a loser's own hand):

| Pairing          | Return | Points a hand | Hands won | Decision time |
| ---------------- | ------ | ------------- | --------- | ------------- |
| Easy vs Random   | +0.579 | +5.8          | 62%       | < 0.1 ms      |
| Medium vs Random | +0.699 | +7.0          | 62%       | < 0.1 ms      |
| Medium vs Easy   | +0.184 | +1.8          | 51%       | < 0.1 ms      |
| Hard vs Easy     | +0.231 | +2.3          | 53%       | < 0.1 ms      |
| Hard vs Medium   | +0.040 | +0.4          | 51%       | < 0.1 ms      |

## States and actions

`EightsState` = `seed`, `players`, `handNo`, `dealer`, `scores`, `hands`, `stock`, `discard`,
`suit`, `toAct`, `drawn`, `passes`, `lacked` (per player), `reshuffles`, `result` (winner, points,
blocked), `history`, `winner`; validated by replay. Actions: `play:c`, `play:c:S` (an eight naming
suit S), `draw`, `pass`, `next`.

## Achievements

| id             | Condition                         |
| -------------- | --------------------------------- |
| `out`          | Go out first in a hand.           |
| `eight-finish` | Go out with an eight.             |
| `big-hand`     | Score 50 or more in one hand.     |
| `match`        | Win a game to 100.                |
| `full-table`   | Win against three Hard opponents. |

## Controls

Tap a playable card (others are dimmed); for an eight pick the suit from four buttons. Draw from the
stock (outlined when you must) and Pass after an unplayable draw. Keyboard: ←/→ choose, Enter play,
D draw, P pass, 1–4 name a suit, H hint, N next hand.

## Graphics and audio

A green table with the opponents' fans of card backs (face up when watching or after a hand), the
stock with its count, the top card and a badge with the suit to follow (red for hearts and
diamonds), the player's hand with the drawn card lifted. Card and chip sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `crazy-eights` v`1.0.0`:
2–4 seats (config `{ players }`), one hand per episode; hidden information (the stock and other
hands hidden until the hand ends); returns per seat: the winner's points / 10, the others minus
their own hand's points / 10.

## Testing criteria

Rules: deal sizes, matching suit or rank, eights naming a suit, drawing and passing with the
public gap recorded, penalties, going out, a three-player game to 100 with replay validation. AI:
eights kept for last, the longest suit named, Hard keeping the next player on their gap. Contract
suite (two and four seats). UI: playing (or drawing) and the opponents answering. E2E desktop +
mobile.
