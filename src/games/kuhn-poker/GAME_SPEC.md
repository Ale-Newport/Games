# #091 Kuhn Poker — Game Specification

Play chips only; no real money. Kuhn poker is a public-domain game from game theory (H. W. Kuhn,
1950).

## Ruleset (`kuhn-3card-12chips`)

- Three cards: jack, queen, king (shown as the spades). Each hand both players ante 1 chip and get
  one card from a deck shuffled from the match seed and the hand number (`?deal=N` replays a
  match); the third card is not used.
- The first player (alternating every hand) checks or bets 1. After a check, the second player
  checks (showdown) or bets 1, and the first player then folds or calls. After a bet, the second
  player folds or calls. The higher card wins the showdown; a fold loses what was put in. A hand
  moves 1 or 2 chips.
- A match: both start with 12 chips; after every hand, a player with fewer than 2 chips (the most
  a hand can cost) loses the match.

## Modes

Play a match against Easy, Medium or Nash (saved after every action, resumable from the menu) or
watch Nash play Medium. Statistics key: the opponent; a match is a win or a loss; the score is the
length of a won match in hands (fewer is better).

## Computer players

| Agent    | Play                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal action.                                                                                                                                        |
| `easy`   | Bets only kings, never bluffs; facing a bet calls with a queen or king and with a jack 20% of the time.                                                  |
| `medium` | Bets kings 70%, bluffs jacks 25% first and 33% after a check, calls bets with queens 40%.                                                                |
| `hard`   | **Nash equilibrium**: CFR+ (regret matching+, linear averaging) over the full game tree, 4000 iterations (about 0.1 s), computed once when first needed. |

The solver (`src/ai/agents/cfr.ts`) also computes exact strategy values and best responses. The
equilibrium found: the first player bluffs a jack with α = 0.23, bets a king 0.70 (≈ 3α) and always
checks a queen; the second player calls a bet with a queen 1/3 of the time and bluffs a jack after a
check 1/3 of the time; facing a bet after its own check the first player calls with a
queen α + 1/3 = 0.57 of the time — the known equilibrium family. Its value: the first player loses
**1/18 ≈ 0.0556** chips a hand (computed −0.0556). Exploitability (what a perfect counter-strategy
wins a hand, averaged over the seats): Nash 0.0004, Medium 0.037, Easy 0.217.

Exact expected results per hand (averaged over both seats): Nash vs Medium +0.0001 (Medium is close
to an equilibrium, so Nash, which never exploits, barely profits), Nash vs Easy +0.028, Medium vs
Easy +0.034. Over 100 000 seeded hands: Nash vs Random +0.153, Nash vs Easy +0.031, Nash vs Medium
+0.003, Medium vs Easy +0.037, Easy vs Random +0.177.

The coach ("Show Nash") prints the equilibrium's probability on each of the player's buttons. When a
hand ends, the table shows the probability the opponent's strategy gave each move it made.

## States and actions

`KuhnState` = `seed`, `chips`, `handNo`, `first`, `cards` (0 jack, 1 queen, 2 king), `betting`
(this hand), `toAct`, `result` (winner, chips won, showdown), `history`, `winner`; validated by
replay. Actions: `check`, `bet`, `call`, `fold`, `next`.

## Achievements

| id           | Condition                                       |
| ------------ | ----------------------------------------------- |
| `first-hand` | Win a hand.                                     |
| `bluff`      | Bet with the jack and make the opponent fold.   |
| `hero-call`  | Call a bet with the queen and win the showdown. |
| `match`      | Win a match.                                    |
| `beat-nash`  | Win a match against Nash.                       |

## Controls

Check / Bet or Fold / Call buttons, Next hand, Show Nash, Menu. Keyboard: C check/call, B bet,
F fold, H coach, N next hand.

## Graphics and audio

A green rounded table with the opponent above and the player below: big cards (the opponent's face
down until a showdown), chip plates with what each put in, the pot and the hand's betting log, a
glow on the winner and a "+n" badge. Shared poker sounds.

## Save format and AI interface

Save slot schema 1: `{ state, difficulty }`, validated by replay. Env `kuhn-poker` v`1.0.0`: two
seats, one hand per episode with player 0 acting first; hidden information (the opponent's card is
−1 in the observation until a showdown); returns ±1 or ±2 chips; action space of 4
(check, bet, call, fold). `exactOracleId: 'hard'`.

## Testing criteria

Rules: antes, check-check, bet-fold and check-bet-call settlements, alternating first player, the
end of a match, replay validation. Equilibrium: α within [0, 1/3], king bets ≈ 3α, queen checks,
second-player calls and bluffs ≈ 1/3, value −1/18, exploitability < 0.002; Medium and Easy more
exploitable; Nash beating Random and Easy and not losing to Medium over 20 000 hands; Medium beating
Easy. Contract suite with the hidden card check. UI: a hand with the coach and the opponent's mix,
the next hand, watch mode. E2E desktop + mobile.
