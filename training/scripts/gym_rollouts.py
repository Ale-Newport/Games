"""Smoke test of the Gymnasium-style wrapper: a seeded random masked policy against a game's own
agent preset, through the real rules engine.

Usage (from the repository root, after `npm ci`):
  python3 training/scripts/gym_rollouts.py --game four-in-a-row --opponent medium --episodes 20
  python3 training/scripts/gym_rollouts.py --game tic-tac-toe --num-envs 8 --episodes 200
  python3 training/scripts/gym_rollouts.py --list   # games with a fixed action encoding
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from arcade_ai import ArcadeGymEnv, EnvServer, VectorArcadeEnv, gym_compatible_games  # noqa: E402


def masked_choice(rng: random.Random, mask) -> int:
    return rng.choice([i for i, flag in enumerate(mask) if flag])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--game", default="tic-tac-toe")
    parser.add_argument("--episodes", type=int, default=50)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--seat", type=int, default=0)
    parser.add_argument("--opponent", default="random", help="agent preset id from the game's AiBundle")
    parser.add_argument("--num-envs", type=int, default=1, help="> 1 uses VectorArcadeEnv")
    parser.add_argument("--max-steps", type=int, default=10_000)
    parser.add_argument("--out", type=Path, default=None, help="optional JSONL episode log")
    parser.add_argument("--list", action="store_true", help="list gym-compatible games and exit")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    results = {"win": 0, "loss": 0, "draw": 0, "truncated": 0}
    lengths: list[int] = []
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
    log = args.out.open("w") if args.out else None

    def record(episode_steps: int, reward: float, truncated: bool, info: dict) -> None:
        key = "truncated" if truncated else "win" if reward > 0 else "loss" if reward < 0 else "draw"
        results[key] += 1
        lengths.append(episode_steps)
        if log:
            log.write(json.dumps({"type": "episode", "steps": episode_steps, "reward": reward, "outcome": info.get("outcome")}) + "\n")

    start = time.time()
    with EnvServer() as server:
        if args.list:
            for row in gym_compatible_games(server):
                obs = row["observationShape"] if row["tensor"] else "json"
                print(f"{row['id']:<28} actions={row['actionSpaceSize']:<8} obs={obs} agents={','.join(row['agents'])}")
            return
        kwargs = dict(seat=args.seat, opponent=args.opponent, max_steps=args.max_steps, server=server)
        if args.num_envs == 1:
            env = ArcadeGymEnv(args.game, **kwargs)
            spaces = (env.action_space, env.observation_space)
            for episode in range(args.episodes):
                _, info = env.reset(seed=args.seed + episode)
                while True:
                    _, reward, terminated, truncated, info = env.step(masked_choice(rng, info["action_mask"]))
                    if terminated or truncated:
                        record(info["episode_steps"], reward, truncated, info)
                        break
            env.close()
        else:
            venv = VectorArcadeEnv(args.game, args.num_envs, **kwargs)
            spaces = (venv.single_action_space, venv.single_observation_space)
            venv.reset(seed=args.seed)
            while len(lengths) < args.episodes:
                actions = [masked_choice(rng, mask) for mask in venv.action_masks()]
                _, rewards, terminated, truncated, infos = venv.step(actions)
                for i in range(args.num_envs):
                    if (terminated[i] or truncated[i]) and len(lengths) < args.episodes:
                        final = infos[i]["final_info"]
                        record(final["episode_steps"], float(rewards[i]), bool(truncated[i]), final)
            venv.close()
    if log:
        log.close()
    seconds = time.time() - start
    summary = {
        "game": args.game,
        "seat": args.seat,
        "opponent": args.opponent,
        "num_envs": args.num_envs,
        "action_space": repr(spaces[0]),
        "observation_space": repr(spaces[1]),
        "episodes": len(lengths),
        "learner_results": results,
        "mean_learner_steps": round(sum(lengths) / max(1, len(lengths)), 2),
        "seconds": round(seconds, 2),
    }
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
