# #098 Euchre — Game Specification

## Ruleset (`euchre-24-stick-10`)

- Four players in two partnerships (the player and north against west and east); a 24-card deck
  (nine to ace) shuffled from the game seed and the hand number (`?deal=N` replays a game); five
  cards each; the next card is turned up; the deal passes to the left every hand.
- **Round one**: from the dealer's left, each player passes or **orders up** the upcard — its suit
  becomes trump, the dealer takes it and throws a card. **Round two** (after four passes): each
  player passes or names a different suit; the dealer may not pass (**stick the dealer**). The maker
  may **go alone**: their partner sits out (and if that is the dealer, the upcard is not taken).
- **Trump ranks**: the jack of trump (right bower), the jack of the same colour (left bower, part of
  the trump suit), then ace, king, queen, ten, nine; other suits ace high.
- **Play**: the player left of the dealer leads (skipping a partner who sits out); follow the led
  suit (the left bower follows as trump); the highest trump, else the highest card of the led suit,
  wins; the winner leads.
- **Scoring**: the makers take three or four tricks: 1; all five: 2, or 4 alone. Fewer than three
  (euchred): the defenders score 2. The first side to **10** wins.

## Modes

Play with an AI partner against two AI opponents, all at Easy, Medium or Hard (saved after every
action, resumable) or watch four AIs (Hard and Medium partnerships) with every hand face up.
Statistics key: the difficulty; the score is the winning margin.

## Computer players

They see their own hand, the upcard, the bidding and the cards played.

| Agent    | Bidding                                                                                                                                                                                               | Play                                                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal call.                                                                                                                                                                                       | Any legal card.                                                                                                                                                                                             |
| `easy`   | Hand value (right bower 3, left 2.5, trump ace 1.8, king 1.4, queen 1.1, ten 0.9, nine 0.8, side aces 1, a void with two trumps 0.5; in round one the upcard counts for the dealer's side) above 6.5. | Its lowest card unless it can win a trick the other side is winning.                                                                                                                                        |
| `medium` | The same value above 5.5; goes alone above 9 with the right bower; a stuck dealer names its best suit; the dealer throws its lowest side card, preferring a void.                                     | Makers lead trump with the right bower or two trumps, otherwise side aces; low under a winning partner; wins as cheaply as it can; trumps in when void.                                                     |
| `hard`   | As Medium with a threshold of 5.2.                                                                                                                                                                    | Each legal card played out over 24 sampled deals of the unseen cards (shown-out suits respected, the ordered upcard placed with the dealer) with Medium for everyone; best average hand score for its side. |

Measured with the two agents as the two partnerships (sides swap every hand), one hand per game;
the return is the side's points minus the other's, halved:

| Pairing          | Hands  | Return | Points a hand | Hands won | Decision time |
| ---------------- | ------ | ------ | ------------- | --------- | ------------- |
| Easy vs Random   | 10 000 | +0.609 | +1.22         | 76%       | < 0.1 ms      |
| Medium vs Random | 10 000 | +0.660 | +1.32         | 80%       | < 0.1 ms      |
| Medium vs Easy   | 10 000 | +0.119 | +0.24         | 59%       | < 0.1 ms      |
| Hard vs Easy     | 2000   | +0.155 | +0.31         | 63%       | 4.7 ms        |
| Hard vs Medium   | 2000   | +0.031 | +0.06         | 53%       | 4.7 ms        |

## States and actions

`EuchreState` = `seed`, `handNo`, `dealer`, `scores`, `hands`, `upcard`, `phase` (`round1` /
`round2` / `throw` / `play` / `done`), `toAct`, `trump`, `maker`, `alone`, `passes`, `trick`,
`leader`, `tricks`, `played`, `lastTrick`, `shownOut`, `buried` (the dealer's throw), `result`,
`history`, `winner`; validated by replay. Actions: `pass`, `order`, `order-alone`, `name:S`,
`name-alone:S`, `throw:c`, `play:c`, `next`.

## Achievements

| id         | Condition                              |
| ---------- | -------------------------------------- |
| `maker`    | Make trump yourself and take the hand. |
| `march`    | Take all five tricks as makers.        |
| `alone`    | Go alone and take all five.            |
| `euchre`   | Euchre the other side.                 |
| `win-game` | Win a game.                            |
| `win-hard` | Win a game at Hard.                    |

## Controls

Order up / Pass in round one, a button per suit (and Pass, except for a stuck dealer) in round two,
with a Go alone tick box; the dealer taps a card to throw; then tap cards to play. Keyboard: O order
up, P pass, ←/→ choose a card, Enter play, H hint, N next hand.

## Graphics and audio

The shared trick table with partnership colours, the dealer button and a star for the maker, the
upcard in the middle during the bidding, the trump suit and maker above the table, the seat that
sits out marked; tricks per side on the plates. Card sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `euchre` v`1.0.0`: four
seats, one hand per episode; hidden information (other hands hidden, the dealer's throw known only
to the dealer); returns per seat = (own side's points − the other's) / 2.

## Testing criteria

Cards: 24, bower ranks and the left bower's suit. Rules: the deal and first call, the dealer's
pickup and throw, round two with stick the dealer, going alone with the partner skipped and the
lone march worth 4, a game to 10 with replay validation. AI: hand values, the throw, staying under a
winning partner, sampled deals respecting shown-out suits. Contract suite (four seats). UI: the
upcard, a bidding hint, the bidding, playing a card. E2E desktop + mobile.
