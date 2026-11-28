# #249 Land Baron

A property-trading board game for 2–5 players (generic name; original board, names, prices,
rents, cards and art — the brief's “Monopoly” entry asks for property trading with rents,
auctions and mortgages). The mechanics are the genre's: a loop of spaces, buying what you land
on, auctions of what is declined, rent doubled for a whole colour district and raised by houses
and hotels built evenly from a limited bank, ferries and utilities, two card decks, taxes, a
jail corner, mortgages, trades and bankruptcy. Everything else is our own: a **36-space** harbour
town (not 40), eight districts of 2–3 lots with their own prices and a rent formula, four
ferries, two works, Luck and Council decks with our own texts, the Lockup, and the currency sign
¤.

| File             | Role                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `board.ts`       | Spaces, districts, prices, rents, ferries, works, taxes, the two decks                                                          |
| `engine.ts`      | Pure rules: turns, doubles, Lockup, buying, auctions, rents, cards, building, mortgages, trades, debts, bankruptcy, timed games |
| `ai.ts`          | Speculator and baron players; landing frequencies; valuations                                                                   |
| `ai-adapter.ts`  | `GameEnvironment`: integer action encoding, observations                                                                        |
| `BaronBoard.tsx` | The board (10 × 10 ring) with bands, owners, buildings, tokens, centre                                                          |
| `BaronTable.tsx` | Menu, prompt and buttons, space panel, trade builder, players, log                                                              |

## Specification

### The board (`board.ts`)

Corners Start (0), Lockup (9), Plaza (18, nothing happens) and Go to the Lockup (27). Districts
(lots, price): Saltmarsh 60/70, Netmakers 100/110, Old Quay 140/140/160, Lantern Row 180/180/200,
Market Hill 220/220/240, Bell Gardens 260/260/280, Admiralty 300/320, Crown Heights 350/400. A
lot's base rent is price / 12 (rounded); with 1–4 houses and a hotel it is 5×, 14×, 38×, 52× and
66× that. House costs 50 (first two districts), 100, 150 and 200 (last two). Ferries (200): rent
25 / 50 / 100 / 200 by ferries owned. Works (150): 4 × the dice, 10 × with both. Taxes 200 and 100. Two Luck and two Council spaces; each deck has 16 cards (moves, nearest ferry or works at
double rent, back three, Lockup, a keepable pardon, money in and out, pay or collect from every
player, repairs per house and hotel).

### Ruleset (`land-baron-36`)

- 1,500 each; passing or landing on Start pays 200. Doubles roll again; a third double in a row
  goes to the Lockup. Go to the Lockup and the Lockup cards send you there without passing Start.
- Unowned property you land on: buy it at its price, or it is **auctioned** among all players
  still in, starting with you: bids go up by at least 1 (the table offers +10, +50, +100 and an
  opening bid of 1); passing leaves the auction; the last bidder standing pays their bid; if
  everyone passes it stays unsold.
- **Rent** as above; bare lots pay double when their owner holds the whole district; mortgaged
  property pays nothing. Owners in the Lockup still collect.
- **Building**: with a whole district and none of it mortgaged, houses go up one at a time and
  evenly (no lot more than one level above another), a hotel after four; the bank holds 32 houses
  and 12 hotels. Buildings sell back for half, evenly; a hotel that cannot be broken down for lack
  of houses in the bank is sold outright.
- **Mortgage** property with no buildings in its district for half its price; **redeem** for that
  plus 10 %.
- **Trades** (in your main phase, up to two offers a turn): any properties without buildings in
  their district and cash either way; the other player accepts or refuses.
- **Lockup**: pay 50 before rolling, use a pardon card, or roll doubles (then move, no extra
  roll); the third failed roll pays 50 and moves.
- **Debts**: a payment you cannot make from cash must be raised by selling buildings and
  mortgaging; if even everything you own cannot cover it, you are bankrupt: buildings go back to
  the bank for half, and cash and property (mortgaged as they are) go to the creditor — or back to
  the bank, unowned and unmortgaged.
- **End**: the last player not bankrupt wins. In a timed game (30 or 60 rounds) the richest wins
  when the rounds run out: worth = cash + property at its price (half when mortgaged) + buildings
  at cost. A 400-round safety limit applies to untimed games.

### Modes, interface, controls

Menu: 2–5 players; opponents Speculators, Barons or all human (pass-and-play: everything in the
game is public); game length (to the end, 30 or 60 rounds); new game; resume; watch the AI; record
(played, won, best worth). The board is a 10 × 10 ring of buttons (colour band facing the centre,
owner outline, mortgage stripes, houses or hotel, tokens); the centre shows the dice and the last
card. Panels: the phase's buttons (roll, bail, pardon, buy, auction, bids, pass, accept, refuse,
end, hint), the selected space (details, rents, build, sell, mortgage, redeem), the trade builder
(partner, properties each way, cash), players (cash, worth, property count, Lockup, pardon) and
the log. On phones the spaces show only icons and prices; details come from tapping. Keys: R roll,
B buy, A auction, E end turn, H hint.

### Saves, statistics, achievements

Versioned slot holding the game (validated: positions, buildings, every card in a deck or held),
the opponents' level and the record. Results against the computer record worth. Achievements:
Landlord (win), True Baron (beat the barons), Whole District, Hotelier, Foreclosure (bankrupt a
player).

### AI interface

Integer actions (265): roll, bail, pardon, buy, decline, pass, raise +10 / +50 / +100, opening bid
1, accept, refuse, end; build, sell, mortgage, redeem per space; and offers to buy a rival's
property for 1, 1.5 or 2 times its price (the table allows any swap). Config `{ players, limit }`
(default two players, 60 rounds). Observations: the whole game except the generator and the
card order.

Agents (public information only):

- **Speculator**: buys above a 50 reserve, bids up to list price, builds on any full district
  above a 100 reserve, mortgages cheapest first, accepts trades worth more than they cost.
- **Baron**: landing frequencies from a Markov chain of the board (dice, cards, the arrest corner;
  the Lockup is the most visited space, a test checks); a value per space (price, the rent at three
  houses times how often it is landed on when it completes a district, blocking a rival's
  district); a cash reserve from the worst rent it could land on next; builds where an extra
  level adds the most expected rent per cost, three houses first; bids and trades by value; asks
  the owner of the last lot of a district for it with cash; stays in the Lockup late in the game.

Measured: one baron vs two speculators (seats rotated, untimed) wins 42 of 60 (20 would be even);
in the unit test (120-round games) at least 24 of 45; speculators beat random players.

### Tests

`tests/engine.test.ts`: the board (sizes, districts, rents rising, prices rising), landing
frequencies; moving and Start pay, doubles rolling again; three doubles, the Lockup (bail, failed
rolls, the third paying), the arrest corner; buying, auctions (raises, passes, unsold); rents
(bare, doubled, houses, mortgaged, ferries, works, paid on landing); even building, hotels and the
house bank, even selling; mortgages and redemption; a card paying from every player; debts raised
by mortgaging and bankruptcy to the creditor; trades and their limits; timed games; random play
keeping the state valid; action codes for agents' moves; valuations; agent strength; adapter
contract (random playouts truncated). `tests/ui.test.tsx`: a whole timed three-player game against
speculators played through the table (rolls, buys, auctions, building, trades, debts as the baron
chooses), and auction / details / trade proposal / resume. `tests/e2e/games/land-baron.spec.ts`:
turns against barons on desktop and mobile (rolls, purchases or auctions, debts, space details,
resume) and watch mode.

### Simplifications

- A bankrupt player's property owed to the bank returns unowned rather than being auctioned at
  once; mortgaged property passed to a creditor keeps its mortgage without the 10 % transfer fee.
- The computer only proposes cash purchases (it accepts any trade by value).
