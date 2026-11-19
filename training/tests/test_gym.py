"""End-to-end tests of the Gymnasium-style bridge against the real TypeScript engines.

Run from the repository root (after `npm ci`):  python3 -m unittest discover -s training/tests -v
They spawn tools/env-server.ts once per test class. NumPy and Gymnasium are optional: the tests
cover the pure-Python mode always and the NumPy/Gymnasium modes when those are installed.
"""

from __future__ import annotations

import json
import random
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from arcade_ai import (  # noqa: E402
    ArcadeEnv,
    ArcadeGymEnv,
    EnvServer,
    EnvServerError,
    IllegalActionError,
    VectorArcadeEnv,
    gym_compatible_games,
)
from arcade_ai.gym import HAS_GYMNASIUM, HAS_NUMPY, Box, Discrete, JsonSpace  # noqa: E402


def flat(obs):
    """Flattens nested lists or NumPy arrays to a list of floats."""
    if hasattr(obs, "ravel"):
        return [float(x) for x in obs.ravel().tolist()]
    if isinstance(obs, list):
        return [x for item in obs for x in flat(item)]
    return [float(obs)]


def play_episode(env, seed, policy_seed=0, check=None):
    """Plays one episode with a seeded uniformly random masked policy; returns the trajectory."""
    rng = random.Random(policy_seed)
    obs, info = env.reset(seed=seed)
    trajectory = [("reset", flat(obs) if env.observation_mode == "tensor" else obs, info["legal_actions"], info["auto_moves"])]
    if check:
        check(env, obs, info, None, False, False)
    while True:
        action = rng.choice(info["legal_actions"])
        obs, reward, terminated, truncated, info = env.step(action)
        trajectory.append((action, flat(obs) if env.observation_mode == "tensor" else obs, reward, terminated, truncated, info["auto_moves"]))
        if check:
            check(env, obs, info, reward, terminated, truncated)
        if terminated or truncated:
            return trajectory, reward, info


class ServerTestCase(unittest.TestCase):
    server: EnvServer

    @classmethod
    def setUpClass(cls) -> None:
        cls.server = EnvServer()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.close()

    def make(self, game, **kwargs):
        kwargs.setdefault("use_numpy", False)
        env = ArcadeGymEnv(game, server=self.server, **kwargs)
        self.addCleanup(env.close)
        return env

    def check_step(self, env, obs, info, reward, terminated, truncated):
        """Invariants that hold after every reset/step of a seat-controlled episode."""
        n = env.action_space.n
        mask = list(info["action_mask"])
        self.assertEqual(len(mask), n)
        self.assertEqual([i for i, m in enumerate(mask) if m], sorted(info["legal_actions"]))
        if env.observation_mode == "tensor":
            self.assertTrue(env.observation_space.contains(obs))
            self.assertEqual(len(flat(obs)), _prod(env.observation_space.shape))
        if terminated:
            self.assertEqual(sum(mask), 0)
            self.assertIn("outcome", info)
            self.assertEqual(reward, info["outcome"]["returns"][env.seat])
        elif not truncated:
            self.assertGreater(sum(mask), 0)
            self.assertEqual(info["current_player"], env.seat)
            self.assertEqual(info["observer"], env.seat)
            if reward is not None:
                self.assertEqual(reward, 0.0)


def _prod(shape):
    out = 1
    for d in shape:
        out *= d
    return out


class TestSpaces(ServerTestCase):
    def test_tic_tac_toe_and_four_in_a_row_spaces(self):
        for game, n, shape in [("tic-tac-toe", 9, (3, 3, 3)), ("four-in-a-row", 7, (3, 6, 7))]:
            env = self.make(game)
            self.assertEqual(env.action_space, Discrete(n))
            self.assertIsInstance(env.observation_space, Box)
            self.assertEqual(env.observation_space.shape, shape)
            self.assertEqual(env.observation_mode, "tensor")
            obs, info = env.reset(seed=1)
            self.assertEqual(len(obs), shape[0])
            self.assertEqual(len(obs[0]), shape[1])
            self.assertTrue(env.observation_space.contains(obs))
            self.assertEqual(list(info["action_mask"]), [1] * n)

    def test_fallback_spaces(self):
        space = Discrete(5, seed=3)
        mask = [0, 1, 0, 1, 0]
        self.assertTrue(all(space.sample(mask) in (1, 3) for _ in range(50)))
        self.assertIn(4, space)
        self.assertNotIn(5, space)
        self.assertNotIn(1.5, space)
        box = Box(0.0, 1.0, (2, 3), seed=1)
        self.assertTrue(box.contains(box.sample()))
        self.assertFalse(box.contains([[0, 0, 0]]))
        self.assertFalse(box.contains([[0, 0, 2], [0, 0, 0]]))

    @unittest.skipUnless(HAS_NUMPY, "NumPy not installed")
    def test_numpy_observations_and_masks(self):
        import numpy as np

        env = self.make("four-in-a-row", use_numpy=True)
        obs, info = env.reset(seed=2)
        self.assertIsInstance(obs, np.ndarray)
        self.assertEqual(obs.shape, (3, 6, 7))
        self.assertEqual(obs.dtype, np.float32)
        self.assertEqual(info["action_mask"].dtype, np.int8)
        self.assertTrue(env.observation_space.contains(obs))
        obs, *_ = env.step(np.int64(3))  # NumPy integers are accepted as actions
        self.assertEqual(obs.shape, (3, 6, 7))

    @unittest.skipUnless(HAS_GYMNASIUM, "Gymnasium not installed")
    def test_gymnasium_integration(self):
        import gymnasium
        from gymnasium.utils.env_checker import check_env

        env = self.make("tic-tac-toe", use_numpy=True)
        self.assertIsInstance(env, gymnasium.Env)
        self.assertIsInstance(env.action_space, gymnasium.spaces.Discrete)
        self.assertIsInstance(env.observation_space, gymnasium.spaces.Box)
        obs, info = env.reset(seed=0)
        self.assertIn(env.action_space.sample(mask=info["action_mask"]), info["legal_actions"])
        check_env(env, skip_render_check=True)


class TestEpisodes(ServerTestCase):
    def test_full_episodes_both_seats(self):
        for game in ("tic-tac-toe", "four-in-a-row"):
            for seat in (0, 1):
                env = self.make(game, seat=seat, opponent="random")
                for seed in range(4):
                    with self.subTest(game=game, seat=seat, seed=seed):
                        trajectory, reward, info = play_episode(env, seed, policy_seed=seed, check=self.check_step)
                        self.assertTrue(trajectory[-1][3], "episode must terminate")
                        self.assertIn(reward, (-1.0, 0.0, 1.0))
                        if seat == 1:
                            # Seat 0 (the opponent) moved before the learner's first turn.
                            self.assertEqual([m["player"] for m in trajectory[0][3]], [0])
                        with self.assertRaises(RuntimeError):
                            env.step(info["legal_actions"][0] if info["legal_actions"] else 0)

    def test_same_seed_same_episode(self):
        for game in ("tic-tac-toe", "four-in-a-row"):
            a = self.make(game, opponent="random")
            b = self.make(game, opponent="random")
            for seed in (0, 7, 123):
                self.assertEqual(play_episode(a, seed, policy_seed=1)[0], play_episode(b, seed, policy_seed=1)[0])
            # The opponent's random choices come from the episode seed: seeds give different games.
            games = {json.dumps(play_episode(a, seed, policy_seed=1)[0]) for seed in range(8)}
            self.assertGreater(len(games), 1)

    def test_unseeded_resets_follow_the_seed_stream(self):
        a = self.make("four-in-a-row")
        b = self.make("four-in-a-row")
        a.reset(seed=99)
        b.reset(seed=99)
        seeds_a = [a.reset()[1]["engine_seed"] for _ in range(3)]
        seeds_b = [b.reset()[1]["engine_seed"] for _ in range(3)]
        self.assertEqual(seeds_a, seeds_b)
        self.assertEqual(len(set(seeds_a)), 3)

    def test_perfect_opponent_never_loses(self):
        env = self.make("tic-tac-toe", opponent="perfect")
        for seed in range(10):
            _, reward, info = play_episode(env, seed, policy_seed=seed)
            self.assertLessEqual(reward, 0.0, info["outcome"])

    def test_medium_four_in_a_row_beats_random_mostly(self):
        env = self.make("four-in-a-row", seat=1, opponent="medium")
        rewards = [play_episode(env, seed, policy_seed=seed)[1] for seed in range(6)]
        self.assertLessEqual(sum(rewards), -4.0, rewards)

    def test_self_play(self):
        env = self.make("tic-tac-toe", seat=None)
        obs, info = env.reset(seed=4)
        self.assertEqual(info["auto_moves"], [])
        player = info["current_player"]
        rng = random.Random(4)
        while True:
            obs, reward, terminated, truncated, info = env.step(rng.choice(info["legal_actions"]))
            if terminated:
                outcome = info["outcome"]
                # The reward is for the seat that just moved; in tic-tac-toe that is the winner.
                self.assertEqual(reward, outcome["returns"][player])
                self.assertGreaterEqual(reward, 0.0)
                break
            self.assertEqual(info["current_player"], 1 - player)
            self.assertEqual(info["observer"], info["current_player"])
            self.assertEqual(reward, 0.0)
            player = info["current_player"]

    def test_seat_option_on_reset(self):
        env = self.make("four-in-a-row", seat=0)
        _, info = env.reset(seed=1, options={"seat": 1})
        self.assertEqual(env.seat, 1)
        self.assertEqual(info["current_player"], 1)
        self.assertEqual(len(info["auto_moves"]), 1)
        with self.assertRaises(ValueError):
            env.reset(seed=1, options={"colour": "red"})

    def test_truncation(self):
        env = self.make("tic-tac-toe", max_steps=2)
        env.reset(seed=0)
        _, _, terminated, truncated, info = env.step(info_legal(env)[0])
        self.assertFalse(terminated or truncated)
        _, _, terminated, truncated, info = env.step(info_legal(env)[0])
        self.assertFalse(terminated)  # three marks are needed to win
        self.assertTrue(truncated)
        with self.assertRaises(RuntimeError):
            env.step(info["legal_actions"][0])
        env.reset(seed=0)  # a reset starts a fresh episode
        self.assertEqual(env.legal_actions(), info_legal(env))

    def test_render_ansi(self):
        env = self.make("tic-tac-toe", render_mode="ansi")
        env.reset(seed=0)
        text = env.render()
        self.assertIn("tic-tac-toe: player 0 to move", text)
        self.assertIsNone(self.make("tic-tac-toe").render())


def info_legal(env):
    return env.legal_actions()


class TestIllegalActions(ServerTestCase):
    def test_illegal_actions_raise_and_keep_the_state(self):
        env = self.make("tic-tac-toe", opponent="random")
        obs, info = env.reset(seed=5)
        obs, _, _, _, info = env.step(4)
        occupied = [i for i in range(9) if i not in info["legal_actions"]]
        self.assertIn(4, occupied)
        for bad in occupied + [9, -1]:
            with self.assertRaises(IllegalActionError):
                env.step(bad)
        with self.assertRaises(TypeError):
            env.step("4")
        self.assertTrue(issubclass(IllegalActionError, ValueError))
        self.assertEqual(env.legal_actions(), info["legal_actions"])
        env.step(info["legal_actions"][0])  # the episode continues normally

    def test_server_rejects_illegal_actions_too(self):
        env = self.make("four-in-a-row", seat=None)  # self-play: both colours alternate
        env.reset(seed=0)
        with self.assertRaises(IllegalActionError):
            self.server.call("gym_step", handle=env.handle, action=7)
        for _ in range(6):
            self.server.call("gym_step", handle=env.handle, action=0)  # fills column 0
        legal = self.server.call("gym_observe", handle=env.handle)["legal"]
        self.assertNotIn(0, legal)
        with self.assertRaises(IllegalActionError):
            self.server.call("gym_step", handle=env.handle, action=0)

    def test_construction_errors(self):
        with self.assertRaisesRegex(EnvServerError, "no fixed discrete action encoding"):
            self.make("english-checkers")
        with self.assertRaisesRegex(EnvServerError, "Unknown agent preset"):
            self.make("tic-tac-toe", opponent="grandmaster")
        with self.assertRaisesRegex(EnvServerError, "no observation tensor"):
            self.make("kuhn-poker", observation="tensor")
        with self.assertRaisesRegex(EnvServerError, "No AI bundle"):
            self.make("no-such-game")


class TestStructuredObservations(ServerTestCase):
    """Kuhn poker: hidden information, seeded deals, no tensor (JSON observations)."""

    def test_kuhn_poker_episodes(self):
        env = self.make("kuhn-poker", opponent="random")
        self.assertIsInstance(env.observation_space, JsonSpace)
        self.assertEqual(env.observation_mode, "raw")
        own_cards = set()
        for seed in range(12):
            trajectory, reward, info = play_episode(env, seed, policy_seed=seed)
            first_obs = trajectory[0][1]
            self.assertIsInstance(first_obs, dict)
            self.assertTrue(env.observation_space.contains(first_obs))
            self.assertEqual(first_obs["cards"][1], -1, "the opponent's card must stay hidden")
            own_cards.add(first_obs["cards"][0])
            self.assertEqual(reward, info["outcome"]["returns"][0])
            self.assertEqual(sum(info["outcome"]["returns"]), 0)
            self.assertEqual(play_episode(env, seed, policy_seed=seed)[0], trajectory)
        self.assertGreater(len(own_cards), 1, "deals must depend on the seed")


class TestVector(ServerTestCase):
    def test_vector_env_autoreset_and_determinism(self):
        def run(seed):
            venv = VectorArcadeEnv("tic-tac-toe", 3, server=self.server, use_numpy=False)
            self.addCleanup(venv.close)
            obs, infos = venv.reset(seed=seed)
            self.assertEqual(len(obs), 3)
            rng = random.Random(seed)
            finished, log = 0, []
            for _ in range(40):
                masks = venv.action_masks()
                actions = [rng.choice([i for i, m in enumerate(mask) if m]) for mask in masks]
                obs, rewards, terminated, truncated, infos = venv.step(actions)
                for i in range(3):
                    if terminated[i] or truncated[i]:
                        finished += 1
                        self.assertIn("final_observation", infos[i])
                        self.assertEqual(rewards[i], infos[i]["final_info"]["outcome"]["returns"][0])
                        self.assertEqual(infos[i]["episode_steps"], 0)  # already reset
                    else:
                        self.assertNotIn("final_observation", infos[i])
                log.append((actions, rewards, terminated, flat(obs)))
            return finished, log

        finished, log = run(3)
        self.assertGreater(finished, 5)
        self.assertEqual(run(3)[1], log)
        with self.assertRaises(IllegalActionError):
            venv = VectorArcadeEnv("four-in-a-row", 2, server=self.server, use_numpy=False)
            self.addCleanup(venv.close)
            venv.reset(seed=0)
            venv.step([0, 7])

    @unittest.skipUnless(HAS_NUMPY, "NumPy not installed")
    def test_vector_env_numpy_batches(self):
        venv = VectorArcadeEnv("four-in-a-row", 4, server=self.server, use_numpy=True)
        self.addCleanup(venv.close)
        obs, _ = venv.reset(seed=0)
        self.assertEqual(obs.shape, (4, 3, 6, 7))
        self.assertEqual(venv.action_masks().shape, (4, 7))
        obs, rewards, terminated, truncated, _ = venv.step([3, 3, 3, 3])
        self.assertEqual(obs.shape, (4, 3, 6, 7))
        self.assertEqual(rewards.shape, (4,))
        self.assertEqual(terminated.dtype, bool)


class TestBridge(ServerTestCase):
    def test_catalog_lists_gym_compatible_games(self):
        rows = gym_compatible_games(self.server, ["tic-tac-toe", "four-in-a-row", "english-checkers", "kuhn-poker"])
        by_id = {row["id"]: row for row in rows}
        self.assertEqual(sorted(by_id), ["four-in-a-row", "kuhn-poker", "tic-tac-toe"])
        self.assertTrue(by_id["tic-tac-toe"]["tensor"])
        self.assertFalse(by_id["kuhn-poker"]["tensor"])
        self.assertIn("perfect", by_id["tic-tac-toe"]["agents"])

    def test_raw_arcade_env_still_works(self):
        env = ArcadeEnv(self.server, "tic-tac-toe", seed=1)
        self.addCleanup(env.close)
        state = env.reset(seed=1)
        self.assertEqual(state["player"], 0)
        state = env.step(4)
        self.assertEqual(state["mover"], 0)
        self.assertNotIn(4, env.legal_actions())
        with self.assertRaises(IllegalActionError):
            env.step(4)
        restored = env.restore(env.serialize())
        self.assertEqual(restored["legal"], env.legal_actions())


if __name__ == "__main__":
    unittest.main()
