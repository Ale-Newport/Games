# Offline training (local only — never required by the website)

The website runs entirely in the browser. This directory is for **future** offline research:
training agents with Python/PyTorch against the **same TypeScript rules engines** the website uses.

## How it connects

`tools/env-server.ts` serves environments over JSON lines (stdin/stdout). `arcade_ai/env.py`
spawns it and exposes a small Python API, so there is no second, divergent simulator. The core
bridge uses only the Python standard library (3.10+).

```bash
# from the repository root, after `npm ci`
python3 training/scripts/random_rollouts.py --game tic-tac-toe --episodes 200 --seed 1
```

## Gymnasium-style environments

`arcade_ai/gym.py` wraps every game with a fixed discrete action encoding (`encodeAction` /
`decodeAction`, `info.actionSpaceSize`; 68 games today, `--list` below prints them) in the
Gymnasium API. [Gymnasium](https://gymnasium.farama.org/) and NumPy are **optional**: when
Gymnasium is installed `ArcadeGymEnv` subclasses `gymnasium.Env` and uses `gymnasium.spaces`;
without it, minimal `Discrete`/`Box` classes are used, and without NumPy observations are nested
lists.

```python
import random
import sys

sys.path.insert(0, "training")  # run from the repository root
from arcade_ai import ArcadeGymEnv

with ArcadeGymEnv("four-in-a-row", seat=0, opponent="medium") as env:
    print(env.action_space, env.observation_space)
    obs, info = env.reset(seed=7)
    rng = random.Random(0)
    while True:
        action = rng.choice(info["legal_actions"])  # or sample with info["action_mask"]
        obs, reward, terminated, truncated, info = env.step(action)
        if terminated or truncated:
            break
    print(reward, info["outcome"]["reason"], info["episode_steps"])
```

```text
Discrete(7) Box(-inf, inf, (3, 6, 7), float32)
-1.0 line 5
```

Conventions:

- **Seats.** The learner controls `seat`; every other seat is played inside the server by one of
  the game's own agent presets (`opponent="random" | "easy" | "medium" | ...`, per-seat
  `opponents={1: "hard"}`), so `step` returns at the learner's next turn. `seat=None` is
  self-play: the learner plays every seat, `info["current_player"]` says whose turn it is and the
  reward is for the seat that just moved. `reset(options={"seat": 1})` switches seats.
- **Chance nodes** (`CHANCE_PLAYER`) are sampled in the server from `getChanceOutcomes` with an
  RNG seeded by the episode seed (same derivation as `playMatch`), as are the opponents' random
  choices: the same seed and the same learner actions reproduce the same episode. Presets that
  search under a time budget are the exception.
- **Rewards** are the engine's `getReward` for the reward seat, summed over the learner's move,
  chance events and opponent replies (the terminal return for current games).
- **Observations** are `getObservationTensor` for the learner's seat (a `Box` of the game's
  `observationShape`). Games without tensors (e.g. `kuhn-poker`) return the structured JSON
  observation (`observation="raw"`, a `JsonSpace`); hidden information stays hidden.
- **Masks.** `info["action_mask"]` (1 = legal), `info["legal_actions"]` and `env.action_masks()`
  (the `sb3-contrib` MaskablePPO convention). An illegal action raises `IllegalActionError` and
  leaves the episode unchanged. `info["auto_moves"]` lists the opponent and chance moves played.
- **Truncation.** `truncated` is set after `max_steps` learner steps (default 10 000).

`VectorArcadeEnv(game, num_envs, ...)` hosts `num_envs` handles on one server process and steps
them in one round trip (`batch`), with same-step autoreset (`info["final_observation"]`,
`info["final_info"]`) and stacked arrays when NumPy is available.

```bash
python3 training/scripts/gym_rollouts.py --game four-in-a-row --opponent medium --episodes 20
python3 training/scripts/gym_rollouts.py --game tic-tac-toe --num-envs 8 --episodes 200
python3 training/scripts/gym_rollouts.py --list
python3 -m unittest discover -s training/tests -v   # bridge tests (CI: Python bridge workflow)
```

## Status

| Piece                                                      | Status                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| JSON-lines environment bridge (`arcade_ai/env.py`)         | Implemented, smoke-tested with `scripts/random_rollouts.py`    |
| Seeded, logged rollouts (`scripts/random_rollouts.py`)     | Implemented (writes JSONL to `training/runs/`)                 |
| Gymnasium-style wrapper (`arcade_ai/gym.py`)               | Implemented; unit tests in `tests/`, `scripts/gym_rollouts.py` |
| Vectorized environments (`VectorArcadeEnv`, one process)   | Implemented: many handles per server, batched steps            |
| Parallel self-play across several server processes         | Planned                                                        |
| PyTorch agents (DQN, PPO, AlphaZero-style), checkpoints    | Planned (`requirements.txt` lists optional deps)               |
| ONNX export → `public/models/<game>/` for ONNX Runtime Web | Planned                                                        |

Run artifacts (`training/runs/`, `training/checkpoints/`) are git-ignored.
