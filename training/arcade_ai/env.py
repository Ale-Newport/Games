"""Python access to Arcade AI Lab environments through tools/env-server.ts.

The server runs the exact TypeScript rules engines used by the website, so training never
depends on a re-implemented simulator.
"""

from __future__ import annotations

import itertools
import json
import subprocess
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]


class EnvServer:
    """One Node process; can host many environment handles (useful for vectorized rollouts)."""

    def __init__(self, repo_root: Path = REPO_ROOT) -> None:
        tsx = repo_root / "node_modules" / ".bin" / "tsx"
        if not tsx.exists():
            raise RuntimeError("Run `npm ci` in the repository root first (tsx not found).")
        self._proc = subprocess.Popen(
            [str(tsx), str(repo_root / "tools" / "env-server.ts")],
            cwd=repo_root,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self._ids = itertools.count(1)

    def call(self, cmd: str, **params: Any) -> Any:
        request_id = next(self._ids)
        assert self._proc.stdin and self._proc.stdout
        self._proc.stdin.write(json.dumps({"id": request_id, "cmd": cmd, **params}) + "\n")
        self._proc.stdin.flush()
        line = self._proc.stdout.readline()
        if not line:
            raise RuntimeError("Environment server exited unexpectedly")
        response = json.loads(line)
        if response.get("id") != request_id:
            raise RuntimeError(f"Mismatched response id: {response}")
        if not response["ok"]:
            raise RuntimeError(response["error"])
        return response["result"]

    def games(self) -> list[str]:
        return self.call("list")

    def close(self) -> None:
        if self._proc.poll() is None:
            self._proc.terminate()
            self._proc.wait(timeout=5)

    def __enter__(self) -> "EnvServer":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()


class ArcadeEnv:
    """A single game environment handle."""

    def __init__(self, server: EnvServer, game: str, seed: int = 0, config: dict | None = None) -> None:
        self.server = server
        self.game = game
        self.info = server.call("info", game=game)
        result = server.call("make", game=game, seed=seed, config=config)
        self.handle = result["handle"]
        self.last = result

    def reset(self, seed: int, config: dict | None = None) -> dict:
        self.last = self.server.call("reset", handle=self.handle, seed=seed, config=config)
        return self.last

    def legal_actions(self) -> list:
        return self.server.call("legal", handle=self.handle)["legal"]

    def observe(self, player: int | None = None) -> dict:
        params = {"handle": self.handle}
        if player is not None:
            params["player"] = player
        return self.server.call("observe", **params)

    def step(self, action: Any) -> dict:
        self.last = self.server.call("step", handle=self.handle, action=action)
        return self.last

    def serialize(self) -> str:
        return self.server.call("serialize", handle=self.handle)

    def restore(self, data: str) -> dict:
        self.last = self.server.call("restore", handle=self.handle, data=data)
        return self.last

    def close(self) -> None:
        self.server.call("close", handle=self.handle)
