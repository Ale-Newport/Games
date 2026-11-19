"""Gymnasium-style environments on top of the JSON-lines bridge (tools/env-server.ts).

``ArcadeGymEnv`` follows the Gymnasium API (``reset`` -> ``(obs, info)``, ``step`` ->
``(obs, reward, terminated, truncated, info)``, ``action_space``, ``observation_space``,
``render``, ``close``) for every game whose environment has a fixed discrete action encoding
(``encodeAction``/``decodeAction`` and ``info.actionSpaceSize``).

Conventions
-----------
* **One controlled seat.** The learner plays ``seat``; every other seat is played inside the
  server by one of the game's own agent presets (``opponent``, default ``"random"``; per-seat
  overrides with ``opponents={1: "hard"}``). ``step`` returns when it is the learner's turn
  again or the game is over. Pass ``seat=None`` for **self-play**: the learner plays every seat,
  ``info["current_player"]`` says whose turn it is and the reward is for the seat that just moved.
* **Chance nodes** (``CHANCE_PLAYER``) are sampled in the server with an RNG seeded from the
  episode seed (same derivation as ``playMatch``), so episodes are reproducible.
* **Rewards** are summed over every transition inside one ``step`` (the learner's move, chance
  events and opponent replies) using the engine's ``getReward`` for the reward seat. For the
  current games this is the terminal return (+1 win, -1 loss, 0 draw, or chip/score returns).
* **Observations** are the game's ``getObservationTensor`` for the observer seat (a ``Box`` of
  ``info.observationShape``), or, for games without tensors, the structured JSON observation
  (``observation="raw"``, a ``JsonSpace``). The observer is the controlled seat; in self-play it
  is the seat to move (the last mover at terminal states).
* **Action masks**: ``info["action_mask"]`` (length ``action_space.n``, 1 = legal) and
  ``info["legal_actions"]`` (encoded indices). ``action_masks()`` returns the current mask.
  Stepping an illegal action raises ``IllegalActionError`` and leaves the episode unchanged.
* **Truncation**: ``truncated`` becomes True after ``max_steps`` learner steps.

Gymnasium and NumPy are optional. With Gymnasium installed the class subclasses
``gymnasium.Env`` and uses ``gymnasium.spaces``; with only the standard library it uses the
minimal ``Discrete``/``Box`` classes below and observations are nested Python lists.
"""

from __future__ import annotations

import json
import operator
import random
from typing import Any, Sequence

from .env import EnvServer, IllegalActionError

try:  # optional
    import numpy as _np
except ImportError:  # pragma: no cover - depends on the environment
    _np = None

try:  # optional (Gymnasium itself depends on NumPy)
    import gymnasium as _gym
    from gymnasium import spaces as _gym_spaces
except ImportError:  # pragma: no cover - depends on the environment
    _gym = None
    _gym_spaces = None

HAS_NUMPY = _np is not None
HAS_GYMNASIUM = _gym is not None

__all__ = [
    "ArcadeGymEnv",
    "Box",
    "Discrete",
    "HAS_GYMNASIUM",
    "HAS_NUMPY",
    "JsonSpace",
    "VectorArcadeEnv",
    "gym_compatible_games",
]


# -------------------------------------------------------------------------------------------------
# Minimal spaces (used when Gymnasium is not installed or NumPy output is disabled)


def _shape_of(value: Any) -> tuple[int, ...]:
    shape = []
    while isinstance(value, (list, tuple)):
        shape.append(len(value))
        value = value[0] if value else None
    return tuple(shape)


def _flatten(value: Any) -> list:
    if isinstance(value, (list, tuple)):
        return [x for item in value for x in _flatten(item)]
    return [value]


def _reshape(flat: Sequence[float], shape: Sequence[int]) -> Any:
    if len(shape) <= 1:
        return list(flat)
    step = len(flat) // shape[0]
    return [_reshape(flat[i * step : (i + 1) * step], shape[1:]) for i in range(shape[0])]


class Discrete:
    """Integers ``0 .. n-1`` (same API subset as ``gymnasium.spaces.Discrete``)."""

    def __init__(self, n: int, seed: int | None = None) -> None:
        if n <= 0:
            raise ValueError("Discrete space needs n > 0")
        self.n = int(n)
        self.shape: tuple[int, ...] = ()
        self.dtype = int
        self._rng = random.Random(seed)

    def seed(self, seed: int | None = None) -> list[int | None]:
        self._rng = random.Random(seed)
        return [seed]

    def sample(self, mask: Sequence[int] | None = None) -> int:
        if mask is None:
            return self._rng.randrange(self.n)
        if len(mask) != self.n:
            raise ValueError(f"mask has length {len(mask)}, expected {self.n}")
        allowed = [i for i, flag in enumerate(mask) if flag]
        return self._rng.choice(allowed) if allowed else 0

    def contains(self, x: Any) -> bool:
        try:
            value = operator.index(x)
        except TypeError:
            return False
        return 0 <= value < self.n

    __contains__ = contains

    def __repr__(self) -> str:
        return f"Discrete({self.n})"

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Discrete) and other.n == self.n


class Box:
    """Real-valued tensors of a fixed shape (subset of ``gymnasium.spaces.Box``).

    Observations are nested lists of floats indexed like the NumPy array would be.
    """

    def __init__(self, low: float, high: float, shape: Sequence[int], seed: int | None = None) -> None:
        self.low = float(low)
        self.high = float(high)
        self.shape = tuple(int(d) for d in shape)
        self.dtype = "float32"
        self._rng = random.Random(seed)

    def seed(self, seed: int | None = None) -> list[int | None]:
        self._rng = random.Random(seed)
        return [seed]

    def sample(self) -> Any:
        size = 1
        for d in self.shape:
            size *= d
        if self.low > float("-inf") and self.high < float("inf"):
            flat = [self._rng.uniform(self.low, self.high) for _ in range(size)]
        else:
            flat = [min(self.high, max(self.low, self._rng.gauss(0.0, 1.0))) for _ in range(size)]
        return _reshape(flat, self.shape)

    def contains(self, x: Any) -> bool:
        if _np is not None and isinstance(x, _np.ndarray):
            if tuple(x.shape) != self.shape:
                return False
            values = x.ravel().tolist()
        else:
            if _shape_of(x) != self.shape:
                return False
            values = _flatten(x)
        return all(isinstance(v, (int, float)) and self.low <= v <= self.high for v in values)

    __contains__ = contains

    def __repr__(self) -> str:
        return f"Box({self.low}, {self.high}, {self.shape}, float32)"


_SpaceBase: Any = _gym_spaces.Space if _gym_spaces is not None else object


class JsonSpace(_SpaceBase):
    """Structured (JSON) observations for games without an observation tensor.

    Contains any JSON-serializable value; it cannot be sampled.
    """

    def __init__(self) -> None:
        if _gym_spaces is not None:
            super().__init__(shape=None, dtype=None)

    def sample(self, mask: Any = None, probability: Any = None) -> Any:  # noqa: ARG002
        raise NotImplementedError("JSON observations cannot be sampled")

    def contains(self, x: Any) -> bool:
        try:
            json.dumps(x)
        except (TypeError, ValueError):
            return False
        return True

    def __contains__(self, x: Any) -> bool:
        return self.contains(x)

    @property
    def is_np_flattenable(self) -> bool:
        return False

    def __repr__(self) -> str:
        return "JsonSpace()"


# -------------------------------------------------------------------------------------------------


def gym_compatible_games(server: EnvServer, games: list[str] | None = None) -> list[dict]:
    """Catalog rows of the games ``ArcadeGymEnv`` can run (fixed action encoding)."""
    return [row for row in server.catalog(games) if row.get("encode") and row.get("actionSpaceSize")]


_EnvBase: Any = _gym.Env if _gym is not None else object


class ArcadeGymEnv(_EnvBase):
    """One game environment with the Gymnasium API. See the module docstring for conventions.

    Args:
        game: registered game id, e.g. ``"four-in-a-row"``.
        seat: controlled seat, or ``None`` for self-play. ``reset(options={"seat": k})`` changes it.
        opponent: agent preset id (from the game's AiBundle) for every other seat.
        opponents: per-seat preset overrides, e.g. ``{1: "hard"}``.
        observation: ``"auto"`` (tensor when available), ``"tensor"`` or ``"raw"``.
        max_steps: learner steps before ``truncated``; ``None`` disables truncation.
        config: game config passed to ``createInitialState`` (``reset`` options may override it).
        time_limit_ms: decision budget passed to opponent agents (time-limited search presets
            are not bit-for-bit reproducible; depth-limited and random presets are).
        render_mode: ``None`` or ``"ansi"``.
        use_numpy: return NumPy arrays (default: when NumPy is installed).
        server: share an existing ``EnvServer``; otherwise one is spawned and closed by ``close()``.
    """

    metadata = {"render_modes": ["ansi"], "render_fps": 4}

    def __init__(
        self,
        game: str,
        *,
        seat: int | None = 0,
        opponent: str = "random",
        opponents: dict[int, str] | None = None,
        observation: str = "auto",
        max_steps: int | None = 10_000,
        config: dict | None = None,
        time_limit_ms: float | None = None,
        render_mode: str | None = None,
        use_numpy: bool | None = None,
        server: EnvServer | None = None,
    ) -> None:
        if render_mode not in (None, "ansi"):
            raise ValueError(f"Unsupported render_mode {render_mode!r} (None or 'ansi')")
        if use_numpy and _np is None:
            raise RuntimeError("use_numpy=True needs NumPy installed")
        if max_steps is not None and max_steps <= 0:
            raise ValueError("max_steps must be positive or None")
        self.game = game
        self.render_mode = render_mode
        self.max_steps = max_steps
        self.use_numpy = (_np is not None) if use_numpy is None else bool(use_numpy)
        self._own_server = server is None
        self.server = server if server is not None else EnvServer()
        self.handle: int | None = None
        params: dict[str, Any] = {
            "game": game,
            "seed": 0,
            "seat": seat,
            "opponent": opponent,
            "opponents": {str(k): v for k, v in (opponents or {}).items()},
            "observation": observation,
            "config": config,
        }
        if time_limit_ms is not None:
            params["timeLimitMs"] = time_limit_ms
        try:
            spec = self.server.call("gym_make", **params)
        except Exception:
            if self._own_server:
                self.server.close()
            raise
        self.handle = spec["handle"]
        #: Static description of the game (kind, players, version, ruleset, agent presets, ...).
        self.game_info: dict = spec
        self.num_players: int = spec["maxPlayers"]
        self.agent_presets: list[str] = spec["agents"]
        self.observation_mode: str = spec["observation"]
        self.seat = seat
        n = int(spec["actionSpaceSize"])
        shape = spec["observationShape"]
        use_gym_spaces = _gym_spaces is not None and self.use_numpy
        if use_gym_spaces:
            self.action_space = _gym_spaces.Discrete(n)
        else:
            self.action_space = Discrete(n)
        if self.observation_mode == "tensor":
            if use_gym_spaces:
                self.observation_space = _gym_spaces.Box(
                    low=-_np.inf, high=_np.inf, shape=tuple(shape), dtype=_np.float32
                )
            else:
                self.observation_space = Box(float("-inf"), float("inf"), shape)
        else:
            self.observation_space = JsonSpace()
        self._shape = tuple(shape) if shape else None
        self._legal: list[int] = []
        self._legal_set: set[int] = set()
        self._done = True
        self._episode_steps = 0
        self._engine_seed: int | None = None
        self._seed_rng: random.Random | None = None
        self._last: dict | None = None

    # -- request/response halves (shared with VectorArcadeEnv) -------------------------------------

    def _next_seed(self, seed: int | None) -> int:
        if seed is not None:
            self._seed_rng = random.Random(seed)
            return int(seed) % 2**32
        if self._seed_rng is None:
            self._seed_rng = random.Random()
        return self._seed_rng.randrange(2**32)

    def _prepare_reset(self, seed: int | None, options: dict | None) -> dict:
        options = dict(options or {})
        params: dict[str, Any] = {"handle": self.handle}
        if "seat" in options:
            params["seat"] = options.pop("seat")
        if "config" in options:
            params["config"] = options.pop("config")
        if options:
            raise ValueError(f"Unknown reset options: {sorted(options)} (seat, config)")
        self._engine_seed = self._next_seed(seed)
        params["seed"] = self._engine_seed
        return params

    def _complete_reset(self, params: dict, result: dict) -> tuple[Any, dict]:
        if "seat" in params:
            self.seat = params["seat"]
        self._episode_steps = 0
        self._done = bool(result["terminal"])
        return self._observation(result), self._info(result)

    def _prepare_step(self, action: Any) -> dict:
        if self.handle is None:
            raise RuntimeError("Environment is closed")
        if self._done:
            raise RuntimeError("Episode is over (or not started); call reset() first")
        try:
            index = operator.index(action)
        except TypeError:
            raise TypeError(f"Action must be an integer index, got {action!r}") from None
        if index not in self._legal_set:
            raise IllegalActionError(f"Action {index} is not legal; legal actions: {self._legal}")
        return {"handle": self.handle, "action": index}

    def _complete_step(self, result: dict) -> tuple[Any, float, bool, bool, dict]:
        self._episode_steps += 1
        reward_seat = self.seat if self.seat is not None else result["mover"]
        reward = float(result["rewards"][reward_seat])
        terminated = bool(result["terminal"])
        truncated = (
            not terminated and self.max_steps is not None and self._episode_steps >= self.max_steps
        )
        self._done = terminated or truncated
        return self._observation(result), reward, terminated, truncated, self._info(result)

    def _observation(self, result: dict) -> Any:
        data = result["observation"]
        if self.observation_mode != "tensor":
            return data
        shape = tuple(result["shape"])
        if self.use_numpy:
            return _np.asarray(data, dtype=_np.float32).reshape(shape)
        return _reshape([float(x) for x in data], shape)

    def _mask(self, legal: Sequence[int]) -> Any:
        n = self.action_space.n
        if self.use_numpy:
            mask = _np.zeros(n, dtype=_np.int8)
            if legal:
                mask[_np.asarray(legal, dtype=_np.int64)] = 1
            return mask
        mask = [0] * n
        for index in legal:
            mask[index] = 1
        return mask

    def _info(self, result: dict) -> dict:
        self._last = result
        self._legal = list(result["legal"])
        self._legal_set = set(self._legal)
        info: dict[str, Any] = {
            "action_mask": self._mask(self._legal),
            "legal_actions": list(self._legal),
            "current_player": result["player"],
            "seat": self.seat,
            "observer": result["observer"],
            "rewards": list(result["rewards"]),
            "auto_moves": result["auto"],
            "episode_steps": self._episode_steps,
            "engine_seed": self._engine_seed,
        }
        if result["terminal"]:
            info["outcome"] = result["outcome"]
        return info

    # -- Gymnasium API ---------------------------------------------------------------------------

    def reset(self, *, seed: int | None = None, options: dict | None = None) -> tuple[Any, dict]:
        """Starts an episode. ``seed`` fixes this episode and seeds the following ones;
        ``options`` may set ``seat`` and ``config``."""
        if self.handle is None:
            raise RuntimeError("Environment is closed")
        if _gym is not None:
            super().reset(seed=seed)  # seeds self.np_random, as Gymnasium expects
        params = self._prepare_reset(seed, options)
        return self._complete_reset(params, self.server.call("gym_reset", **params))

    def step(self, action: Any) -> tuple[Any, float, bool, bool, dict]:
        params = self._prepare_step(action)
        return self._complete_step(self.server.call("gym_step", **params))

    def action_masks(self) -> Any:
        """Mask of the current legal actions (the ``sb3-contrib`` MaskablePPO convention)."""
        return self._mask(self._legal)

    def legal_actions(self) -> list[int]:
        return list(self._legal)

    def render(self) -> str | None:
        if self.render_mode != "ansi" or self.handle is None:
            return None
        view = self.server.call("gym_observe", handle=self.handle)
        status = "terminal" if view["terminal"] else f"player {view['player']} to move"
        lines = [f"{self.game}: {status} (observer {view['observer']})"]
        if view["terminal"] and view["outcome"]:
            lines.append(f"outcome: {json.dumps(view['outcome'], sort_keys=True)}")
        lines.append(json.dumps(view["raw"], sort_keys=True))
        return "\n".join(lines)

    def close(self) -> None:
        if self.handle is not None:
            handle, self.handle = self.handle, None
            try:
                self.server.call("close", handle=handle)
            except Exception:  # server already gone
                pass
        if self._own_server:
            self.server.close()

    def __enter__(self) -> "ArcadeGymEnv":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def __repr__(self) -> str:
        return f"ArcadeGymEnv({self.game!r}, seat={self.seat!r}, observation={self.observation_mode!r})"


class VectorArcadeEnv:
    """``num_envs`` copies of one game on a single server process, stepped in one round trip.

    ``reset`` returns ``(observations, infos)`` and ``step`` returns ``(observations, rewards,
    terminated, truncated, infos)``: NumPy arrays when NumPy is used (lists otherwise) and a list
    of per-environment info dicts. Finished environments reset automatically in the same step:
    the returned observation/info belong to the new episode and the finished episode's are in
    ``info["final_observation"]`` and ``info["final_info"]``. Each sub-environment draws its next
    episode seed from its own seeded stream, so a seeded run is reproducible.
    """

    def __init__(self, game: str, num_envs: int, *, server: EnvServer | None = None, **kwargs: Any) -> None:
        if num_envs <= 0:
            raise ValueError("num_envs must be positive")
        self._own_server = server is None
        self.server = server if server is not None else EnvServer()
        self.envs: list[ArcadeGymEnv] = []
        try:
            for _ in range(num_envs):
                self.envs.append(ArcadeGymEnv(game, server=self.server, **kwargs))
        except Exception:
            self.close()
            raise
        self.num_envs = num_envs
        self.single_action_space = self.envs[0].action_space
        self.single_observation_space = self.envs[0].observation_space
        self.use_numpy = self.envs[0].use_numpy

    def _stack_obs(self, observations: list) -> Any:
        """One array of shape ``(num_envs, *shape)`` for tensors with NumPy, else a list."""
        if self.use_numpy and self.envs[0].observation_mode == "tensor":
            return _np.stack(observations)
        return observations

    def _reset_envs(self, indices: list[int], seeds: list[int | None], options: dict | None) -> list[tuple[Any, dict]]:
        params = [self.envs[i]._prepare_reset(seed, options) for i, seed in zip(indices, seeds)]
        results = self.server.batch([("gym_reset", p) for p in params])
        return [self.envs[i]._complete_reset(p, r) for i, p, r in zip(indices, params, results)]

    def reset(self, *, seed: int | Sequence[int] | None = None, options: dict | None = None) -> tuple[Any, list[dict]]:
        """``seed`` may be one int (environment ``i`` gets ``seed + i``) or one seed per env."""
        if seed is None:
            seeds: list[int | None] = [None] * self.num_envs
        elif isinstance(seed, int):
            seeds = [seed + i for i in range(self.num_envs)]
        else:
            seeds = list(seed)
            if len(seeds) != self.num_envs:
                raise ValueError(f"Expected {self.num_envs} seeds, got {len(seeds)}")
        outs = self._reset_envs(list(range(self.num_envs)), seeds, options)
        return self._stack_obs([o for o, _ in outs]), [i for _, i in outs]

    def step(self, actions: Sequence[Any]) -> tuple[Any, Any, Any, Any, list[dict]]:
        actions = list(actions)
        if len(actions) != self.num_envs:
            raise ValueError(f"Expected {self.num_envs} actions, got {len(actions)}")
        params = []
        for i, (env, action) in enumerate(zip(self.envs, actions)):
            try:
                params.append(env._prepare_step(action))
            except IllegalActionError as error:
                raise IllegalActionError(f"env {i}: {error}") from None
        results = self.server.batch([("gym_step", p) for p in params])
        steps = [env._complete_step(r) for env, r in zip(self.envs, results)]
        obs = [s[0] for s in steps]
        infos = [s[4] for s in steps]
        done = [i for i, s in enumerate(steps) if s[2] or s[3]]
        if done:
            for i, (new_obs, new_info) in zip(done, self._reset_envs(done, [None] * len(done), None)):
                new_info["final_observation"] = obs[i]
                new_info["final_info"] = infos[i]
                obs[i], infos[i] = new_obs, new_info
        rewards = [s[1] for s in steps]
        terminated = [s[2] for s in steps]
        truncated = [s[3] for s in steps]
        if self.use_numpy:
            return (
                self._stack_obs(obs),
                _np.asarray(rewards, dtype=_np.float32),
                _np.asarray(terminated, dtype=bool),
                _np.asarray(truncated, dtype=bool),
                infos,
            )
        return obs, rewards, terminated, truncated, infos

    def action_masks(self) -> Any:
        masks = [env.action_masks() for env in self.envs]
        return _np.stack(masks) if self.use_numpy else masks

    def close(self) -> None:
        for env in self.envs:
            env.close()
        self.envs = []
        if self._own_server:
            self.server.close()

    def __enter__(self) -> "VectorArcadeEnv":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()
