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


class EnvServerError(RuntimeError):
    """An error reported by the environment server. `kind` is the JS error name."""

    def __init__(self, message: str, kind: str = "Error") -> None:
        super().__init__(message)
        self.kind = kind


class IllegalActionError(EnvServerError, ValueError):
    """The action is not legal in the current state (the state is left unchanged)."""

    def __init__(self, message: str, kind: str = "IllegalActionError") -> None:
        super().__init__(message, kind)


def _server_error(response: dict) -> EnvServerError:
    kind = response.get("type") or "Error"
    cls = IllegalActionError if kind == "IllegalActionError" else EnvServerError
    return cls(response.get("error", "Unknown server error"), kind)


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
        """Sends one command; raises EnvServerError (IllegalActionError for illegal actions)."""
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
            raise _server_error(response)
        return response["result"]

    def batch(self, requests: list[tuple[str, dict]]) -> list[Any]:
        """Runs several commands in one round trip, in order. Raises the first failure (its
        index is in the message); requests after a failure have still been executed."""
        payload = [{"cmd": cmd, **params} for cmd, params in requests]
        results = self.call("batch", requests=payload)
        for index, response in enumerate(results):
            if not response["ok"]:
                error = _server_error(response)
                error.args = (f"batch request {index} ({requests[index][0]}): {error}",)
                raise error
        return [response["result"] for response in results]

    def catalog(self, games: list[str] | None = None) -> list[dict]:
        """Per-game capabilities (action encoding, tensors, agent presets) or a load error."""
        return self.call("catalog", **({"games": games} if games is not None else {}))

    def games(self) -> list[str]:
        return self.call("list")

    def close(self) -> None:
        if self._proc.poll() is None:
            self._proc.terminate()
            self._proc.wait(timeout=5)
        for stream in (self._proc.stdin, self._proc.stdout):
            if stream and not stream.closed:
                stream.close()

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
