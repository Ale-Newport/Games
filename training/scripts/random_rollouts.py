"""Seeded random rollouts through the real rules engine, logged as JSONL.

Usage: python3 training/scripts/random_rollouts.py --game tic-tac-toe --episodes 200 --seed 1
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from arcade_ai import ArcadeEnv, EnvServer  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--game", required=True)
    parser.add_argument("--episodes", type=int, default=100)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    out = args.out or Path("training/runs") / f"random-{args.game}-seed{args.seed}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)

    with EnvServer() as server, out.open("w") as log:
        env = ArcadeEnv(server, args.game, seed=args.seed)
        header = {"type": "run", "game": args.game, "version": env.info["version"], "ruleset": env.info["rulesetId"], "seed": args.seed, "episodes": args.episodes}
        log.write(json.dumps(header) + "\n")
        totals: dict[str, int] = {}
        start = time.time()
        for episode in range(args.episodes):
            state = env.reset(seed=args.seed + episode)
            steps = 0
            while not state["terminal"]:
                state = env.step(rng.choice(state["legal"]))
                steps += 1
            outcome = state["outcome"]
            key = "draw" if outcome["draw"] else f"win:{','.join(map(str, outcome['winners']))}"
            totals[key] = totals.get(key, 0) + 1
            log.write(json.dumps({"type": "episode", "episode": episode, "steps": steps, "outcome": outcome}) + "\n")
        summary = {"type": "summary", "results": totals, "seconds": round(time.time() - start, 3)}
        log.write(json.dumps(summary) + "\n")
    print(json.dumps(summary))
    print(f"Log written to {out}")


if __name__ == "__main__":
    main()
