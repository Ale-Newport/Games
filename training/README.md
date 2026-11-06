# Offline training (local only — never required by the website)

The website runs entirely in the browser. This directory is for **future** offline research:
training agents with Python/PyTorch against the **same TypeScript rules engines** the website uses.

## How it connects

`tools/env-server.ts` serves environments over JSON lines (stdin/stdout). `arcade_ai/env.py`
spawns it and exposes a small Python API, so there is no second, divergent simulator.

```bash
# from the repository root, after `npm ci`
python3 training/scripts/random_rollouts.py --game tic-tac-toe --episodes 200 --seed 1
```

## Status

| Piece                                                      | Status                                                      |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| JSON-lines environment bridge (`arcade_ai/env.py`)         | Implemented, smoke-tested with `scripts/random_rollouts.py` |
| Seeded, logged rollouts (`scripts/random_rollouts.py`)     | Implemented (writes JSONL to `training/runs/`)              |
| Vectorized environments / parallel self-play               | Planned: many handles per server, N server processes        |
| PyTorch agents (DQN, PPO, AlphaZero-style), checkpoints    | Planned (`requirements.txt` lists optional deps)            |
| ONNX export → `public/models/<game>/` for ONNX Runtime Web | Planned                                                     |

Run artifacts (`training/runs/`, `training/checkpoints/`) are git-ignored.
