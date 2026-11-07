# #100 Go Fish — Game Specification

## Ruleset (`gofish-books-2to4`)

- 2–4 players (the player and 1–3 AI opponents); seven cards each with two or three players, five
  with four, from a deck shuffled from the game seed (`?deal=N` replays a game); the rest is the
  face-down **pond**. Books dealt complete are laid down at once.
- A turn: ask another player (who has cards) for a rank you hold. If they have any, they hand them
  all over and you ask again. If not — "Go fish!" — you draw from the pond; drawing the asked rank
  lets you ask again, otherwise the turn passes to the left.
- Four cards of a rank form a **book**, laid down at once.
- A player with an empty hand (or nobody left to ask) draws a card from the pond and keeps the
  turn; with the pond empty too, they pass.
- When all thirteen books are down, the most books wins; ties share the win.

## Modes

One game against 1–3 opponents at Easy, Medium or Hard (saved after every action, resumable) or
watch four AIs (Hard, Medium, Easy, Hard) with every hand face up. Statistics key: the difficulty;
the score is the player's books; a shared win records a draw.

## Computer players

Everything they use is public: every ask (who asked whom for which rank, how many cards changed
hands, whether the fished card was the asked rank), the books, the hand sizes and the pond size.
From it they know that an asker holds the rank (plus what it received), that a player who said
"go fish" lacks it until they draw again, and how many unseen cards each player drew since.

| Agent    | Asks                                                                                                                                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal ask.                                                                                                                                                                                                                                                                              |
| `easy`   | A random rank it holds from a random player (the same as `random`: Go Fish has no other moves).                                                                                                                                                                                             |
| `medium` | A player known to hold one of its ranks; otherwise its most numerous rank, never from a player known to lack it.                                                                                                                                                                            |
| `hard`   | The ask with the best chance of success (certain for a known holder; otherwise the unseen copies spread over the unknown cards of the other hands and the pond, limited to what a denier drew since), weighted by the cards it brings toward a book; it keeps asking for a three of a kind. |

Measured over 10 000 seeded two-player games per pairing (seats alternating; return = (own books −
the opponent's) / 13):

| Pairing          | Return | Books a game | Games won | Decision time |
| ---------------- | ------ | ------------ | --------- | ------------- |
| Easy vs Random   | −0.007 | −0.1         | 49%       | < 0.1 ms      |
| Medium vs Random | +0.051 | +0.7         | 56%       | < 0.1 ms      |
| Medium vs Easy   | +0.051 | +0.7         | 56%       | < 0.1 ms      |
| Hard vs Easy     | +0.107 | +1.4         | 61%       | < 0.1 ms      |
| Hard vs Medium   | +0.009 | +0.1         | 51%       | < 0.1 ms      |

Go Fish is mostly luck, and asking also tells everyone what you hold: Hard's sharper asks reveal
more ranks, which Medium's memory then takes, so the two are close head to head while Hard gains
twice as much against Easy. Weightings tried and measured on the way (pure chance of success,
pure book-building, a penalty for revealing new ranks) all did worse.

## States and actions

`FishState` = `seed`, `players`, `hands`, `pond`, `books` (ranks per player), `toAct`, `asks`
(asker, target, rank, got, lucky), `draws` (per player), `history`, `over`, `winners`; validated by
replay. Actions: `ask:T:R` (seat T, rank 1–13), `draw`, `pass`.

## Achievements

| id           | Condition                            |
| ------------ | ------------------------------------ |
| `book`       | Lay down a book.                     |
| `big-catch`  | Get three cards from a single ask.   |
| `lucky`      | Fish up the very rank you asked for. |
| `win`        | Win a game outright.                 |
| `full-table` | Win against three Hard opponents.    |

## Controls

Tap a card to pick its rank (all its cards lift), then an opponent's plate or an "Ask …" button;
with a single opponent the ask is immediate. Draw from the pond (outlined when you must) and Pass
when there is nothing to do. Keyboard: ←/→ choose a rank, Enter ask (one opponent), 1–3 ask that
opponent, D draw, P pass, H hint.

## Graphics and audio

A green table with the opponents' fans of card backs (face up when watching or at the end), their
laid-down books as small rank tiles, the pond with its count (a dashed outline once empty), a log
of the last five asks and answers ("Go fish!", cards handed over, books laid down, the card you
fished), and the player's hand sorted by suit and rank. Card, chip and pot sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `go-fish` v`1.0.0`: 2–4 seats
(config `{ players }`), one game per episode; hidden information (other hands and the pond hidden
until the end); returns per seat: (own books − the others' average) / 13.

## Testing criteria

Rules: deal sizes, a successful ask keeping the turn, go fish passing the turn or (lucky) keeping
it, books, an empty hand drawing, a three-player game to the end with replay validation. AI:
knowledge from the asks (holder and denier), Medium and Hard asking a known holder, the chance
formula. Contract suite (two and four seats). UI: picking a rank and a target with three players,
the immediate ask with one, the log, saves. E2E desktop + mobile.
