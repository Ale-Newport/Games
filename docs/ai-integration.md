# AI Integration Contract

The platform is built so that future agents — search, solvers, reinforcement learning, self-play,
CFR, neural policies — can be added **without rewriting games**. Every game exposes its real
rules engine through one environment interface.

## 1. Environment interface

`src/ai/protocols/types.ts` → `GameEnvironment<S, A, O, C>`:

| Method                                                            | Meaning                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `createInitialState(config, seed)` / `reset(seed)`                | Deterministic initial state                                                                             |
| `getObservation(state, player)`                                   | What `player` may know — **never** opponents' private data                                              |
| `getLegalActions(state, player?)`                                 | Legal actions (empty when terminal)                                                                     |
| `applyAction(state, action)`                                      | Pure transition → new state; throws `IllegalActionError`                                                |
| `getCurrentPlayer(state)`                                         | Seat to act, `CHANCE_PLAYER` (-1) at chance nodes, `NO_PLAYER` (-2) when terminal                       |
| `isTerminal(state)`, `getOutcome(state)`                          | Terminal test; outcome has per-seat `returns`, `winners`, `draw`, `reason`                              |
| `getReward(state, player)`                                        | Reward (terminal return for sparse-reward games)                                                        |
| `serializeState`, `deserializeState`, `cloneState`                | Exact round-trips                                                                                       |
| optional `stateKey`                                               | Transposition key for perfect-information games                                                         |
| optional `getChanceOutcomes`                                      | Explicit chance distribution (dice, shuffles)                                                           |
| optional `encodeAction` / `decodeAction` / `getObservationTensor` | Fixed discrete action space & tensors for neural nets (`info.actionSpaceSize`, `info.observationShape`) |

`info` declares `kind` (`turn-based`, `simultaneous`, `real-time`, `puzzle`), player counts,
`stochastic`, `hiddenInformation`, `zeroSum`, and optional `tickRate`.

### Conventions by game type

- **Deterministic turn-based** (Tic-Tac-Toe, Chess, Go): standard; provide `stateKey`.
- **Stochastic** (Backgammon, Yahtzee): chance events are explicit actions taken by
  `CHANCE_PLAYER`, with `getChanceOutcomes` giving probabilities. Interactive play samples them
  with the state's seeded RNG; tests and search can enumerate them.
- **Hidden information** (Poker, Bridge, Battleship): the full state contains everything;
  `getObservation(state, p)` is the information state for `p`. Contract tests check that changing
  hidden opponent data does not change `p`'s observation. Search agents must sample
  determinizations (future `sampleDeterminization(observation, rng)` hook).
- **Simultaneous** (Rock Paper Scissors): one joint action per step (e.g. `{ p0, p1 }`), or
  sequential commitment with hidden pending actions; documented per game.
- **Real-time** (arcade): `applyAction` advances exactly one fixed simulation tick
  (`info.tickRate` Hz) with the chosen discrete action (including a no-op). Observations are
  either structured state or a downsampled frame tensor.
- **Puzzles**: single seat; `getReward` may be dense (e.g. tiles merged) and `returns[0]` is the
  final score/solved flag.

## 2. AI bundles and agents

Each game's `ai-adapter.ts` exports an `AiBundle` (`src/ai/protocols/bundle.ts`):
`{ env, agents: AgentPreset[], exactOracleId? }`. Agent presets are the game's computer opponents
and baselines (id, localized label/description, kind, `create()`).

Generic agents (`src/ai/agents/`):

- `RandomAgent` — uniform legal action.
- `EpsilonAgent` — wraps another agent; random move with probability ε (difficulty tuning).
- `AlphaBetaAgent` — minimax with alpha-beta pruning, transposition table (via `stateKey`),
  iterative deepening under a time budget, mate-distance scoring, uniform tie-breaking; values are
  from the root player's perspective so extra-turn games work.
- `MctsAgent` — UCT with random rollouts, any number of players, chance nodes supported.

Game-specific heuristics (evaluation functions, move ordering) live in the game's `ai.ts`, never
in the rules engine.

## 3. Evaluation

`src/ai/evaluation/evaluate.ts` → `evaluateAgents(env, A, B, { games, seed, swapSeats })` returns an
`EvaluationReport` containing: game id, **game version**, **ruleset id**, agent ids/labels, every
seed, seat-swapping flag, time limit, win/loss/draw counts and rates, average return, average
moves, average/max decision latency, and average nodes searched.

Run it from the AI Lab (in a Web Worker) or the CLI:

```bash
npm run evaluate -- tic-tac-toe perfect random 1000 1
```

A 100% empirical win rate is **not** a proof of optimality. Where an exact solver exists
(`exactOracleId`), compare move choices against the oracle for optimal-move agreement.

## 4. Compatibility tests (required for every game)

`src/ai/protocols/contract-suite.ts` → `describeAdapterContract(env, options)` asserts:

1. valid initial states; 2. legal actions are accepted and never mutate input states;
2. random playouts terminate with consistent outcomes and rewards; 4. serialization and cloning
   round-trip exactly; 5. deterministic replay from `{seed, actions}`; 6. illegal actions throw;
3. optional observation checks (hidden information); 8. optional action-encoding round-trips;
4. stress playouts across many seeds.

## 5. Offline training (outside GitHub Pages)

`tools/env-server.ts` serves any registered environment over JSON lines on stdin/stdout:

```json
{"id":1,"cmd":"make","game":"tic-tac-toe","seed":7}
{"id":2,"cmd":"legal","handle":0}
{"id":3,"cmd":"step","handle":0,"action":4}
```

`training/arcade_ai/env.py` wraps it as a Python environment, so PyTorch training uses the exact
TypeScript rules (no second simulator). Planned training pipeline (`training/README.md`):
vectorized environments (many handles per server, several servers), self-play workers, seeded
runs, experiment logs (JSONL), checkpoints, evaluation against baselines, and export to ONNX for
ONNX Runtime Web. Exported models will live under `public/models/<game>/<model>/` and load on
demand only when a user selects them.

## 6. AI Lab (in the platform)

Implemented now: agent-vs-agent arena with real, reproducible evaluation (Web Worker), downloadable
JSON reports, local evaluation history, baseline agent catalog, links to play against or watch
agents. Clearly marked as **not yet implemented**: training runs/history, learning curves, model
loading, in-browser neural inference, model comparisons. No trained models or charts are faked.
