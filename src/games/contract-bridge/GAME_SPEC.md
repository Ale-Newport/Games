# #095 Contract Bridge — Game Specification

## Ruleset (`bridge-chicago-duplicate`)

- Four players in two partnerships: north–south (the player is south, an AI partner north) against
  east–west. A **Chicago** is four deals; the dealer rotates clockwise from south; each deal is
  shuffled from the game seed and the deal number (`?deal=N` replays a Chicago).
- **Auction** from the dealer: a bid is a level (1–7) and a strain (♣ < ♦ < ♥ < ♠ < NT) above the
  last bid; a player may pass, double the opponents' last bid, or redouble a double of their own
  side's bid. Four opening passes throw the deal in (no score); otherwise three passes after a bid
  end the auction.
- The **declarer** is the first player of the contracting side to have named the final strain. The
  player on the declarer's left leads; then dummy (the declarer's partner) is face up and the
  declarer plays it. Follow suit if possible; the trump suit beats the others; the trick winner
  leads next.
- **Scoring** (duplicate): trick values 20 (♣ ♦), 30 (♥ ♠), NT 40 + 30; doubled ×2, redoubled ×4.
  Game (100+ in contract points) +300 / +500 vulnerable, otherwise +50; small slam +500 / +750,
  grand slam +1000 / +1500; +50 / +100 for making a doubled / redoubled contract; overtricks at trick
  value, or 100 / 200 each doubled (×2 redoubled). Undertricks: 50 / 100 each undoubled; doubled
  100, 200, 200, then 300 each (not vulnerable) or 200, then 300 each (vulnerable); redoubled ×2.
- **Chicago vulnerability**: deal 1 none, deals 2 and 3 the dealer's side, deal 4 both. The higher
  total after four deals wins (equal totals tie).
- The player always plays for north–south when they declare (both hands, north face up and
  tappable); when east–west declare, the player defends from south with the AI partner.

## Modes

Play a Chicago with partner and opponents at Easy, Medium or Hard (saved after every action,
resumable) or watch four AIs (Hard and Medium partnerships) with every hand face up. Statistics key:
the difficulty; a Chicago is a win, a loss or a draw; the score is north–south's lead in points.

## Computer players

| Agent    | Auction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Play                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `random` | Any legal call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Any legal card.                                                                                                                                                                                                                                                                                                                                                    |
| `easy`   | Opens by the system, never competes; places part-scores (game only with 26+ estimated).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Wins the trick with its cheapest winner if it can, otherwise plays its lowest card.                                                                                                                                                                                                                                                                                |
| `medium` | **Openings**: 2♣ 22+, 2NT 20–21 balanced, 1NT 15–17 balanced, one of a suit with 12+ (or 11 with two long suits) — a five-card major, else the longer minor — and weak twos (six cards, 6–10). **Competition**: 1NT overcall 15–18 balanced, suit overcalls (five cards, 8–16; 11+ at the two level; never in their suit), takeout doubles (12+, short in their suit). **Placement**: partner's range and suit lengths read from their calls; strain by an eight-card major fit, no trump, a minor fit or a long suit; level by combined points (20 two, 23 three, 25 game, 33 small slam, 37 grand slam); stops once partner has placed a game; doubles with game values when outbid. Responders need 6 points. | Leads partner's suit, a master, the top of an honour sequence or fourth best of its longest suit; as declarer draws trumps while the defenders may hold some, then cashes masters; second hand low unless it holds a master; wins as cheaply as it can; never overtakes a partner whose card is the master or who is last to play; discards from its weakest suit. |
| `hard`   | As Medium.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | For each legal card, 16 sampled layouts of the hidden hands (dummy and the played cards are known; shown-out suits respected) played out by Medium; keeps the card with the most tricks for its side on average.                                                                                                                                                   |

On 200 deals bid and played by Medium for all four seats, 199 reached a contract (one passed out);
59% of them were made. Levels: 41 at one, 50 at two, 65 at three, 30 at four, 6 at five, 7 slams.

Measured with the two agents as the two partnerships (sides swap every deal), one deal per game;
the return is the side's points minus the other side's, in hundreds:

| Pairing          | Deals | Return | Points a deal | Deals won | Decision time |
| ---------------- | ----- | ------ | ------------- | --------- | ------------- |
| Easy vs Random   | 1000  | +3.64  | +364          | 100%      | < 0.1 ms      |
| Medium vs Random | 1000  | +7.63  | +763          | 100%      | < 0.1 ms      |
| Medium vs Easy   | 1000  | +0.58  | +58           | 59%       | < 0.1 ms      |
| Hard vs Easy     | 200   | +1.48  | +148          | 79%       | 29 ms         |
| Hard vs Medium   | 200   | +1.23  | +123          | 76%       | 28 ms         |

(Hard and Medium bid alike; Hard's edge over Medium comes entirely from the card play.)

## States and actions

`BridgeState` = `seed`, `dealNo`, `dealer`, `vulnerable`, `hands`, `phase` (`auction` / `play` /
`done`), `auction`, `contract` (level, strain, declarer, doubled), `toAct` (dummy's seat on its
turn), `trick`, `tricks` per side, `played`, `lastTrick`, `dummyShown`, `shownOut`, `result`
(points per side, over- or undertricks, passed out), `scores`, `history`, `over`, `winner`;
validated by replay. Actions: `bid:1C` … `bid:7N`, `pass`, `double`, `redouble`, `play:c`, `next`.

## Achievements

| id         | Condition                       |
| ---------- | ------------------------------- |
| `game`     | Make a game contract.           |
| `slam`     | Make a slam.                    |
| `doubled`  | Make a doubled contract.        |
| `defeat`   | Defeat the opponents' contract. |
| `chicago`  | Win a Chicago.                  |
| `win-hard` | Win a Chicago at Hard.          |

## Controls

The bidding box (35 bids in a grid, with Pass, Double and Redouble; illegal calls disabled, the
hint outlines Medium's call) and the auction grid in the middle of the table (W N E S columns).
During play tap your cards, or north's when declaring. Keyboard: P pass, D double, ←/→ choose a
card, Enter play, H hint, N next deal.

## Graphics and audio

The shared trick table with partnership colours, the dealer button, each plate showing the seat's
last call during the auction and then ★ for the declarer (with the contract) and ⌂ for dummy; dummy
face up with larger cards (north's tappable when the player declares); the contract and trick count
above the table; scores and vulnerability in the header. Card sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `contract-bridge` v`1.0.0`:
four seats, one deal per episode (nobody vulnerable); the current player on dummy's turn is the
declarer; hidden information (other hands hidden, dummy visible once the lead is made, the declarer
always sees it); returns per seat = (own side's points − the other side's) / 100.

## Testing criteria

Auction: higher bids, doubles and redoubles only against the right side, three passes, the
declarer rule, the lead and dummy control, a passed-out deal. Scoring: part-score, NT game, a
vulnerable major game, slams, doubled makes and undertricks (both vulnerabilities), redoubled
undertricks; Chicago vulnerability; a full Chicago with replay validation. AI: point count and
balance, 1NT / 1♥ / weak 2♠ openings, raising partner's major to game, legal play, sampled layouts
keeping dummy. Contract suite (four seats). UI: the bidding box and hint, the auction to a contract,
playing dummy's and north's cards. E2E desktop + mobile.
