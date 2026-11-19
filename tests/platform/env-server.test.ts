import { describe, expect, it } from 'vitest';
import { RandomAgent } from '../../src/ai/agents/random-agent';
import { loadAiBundle, type AnyBundle } from '../../src/ai/adapters/registry';
import {
  CHANCE_PLAYER,
  IllegalActionError,
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
} from '../../src/ai/protocols/types';
import { createEnvServer, type Message } from '../../tools/env-server-core';

/**
 * Fixture with explicit chance nodes (no registered game emits CHANCE_PLAYER yet): two racers,
 * a die showing 1, 2 or 3 with probabilities 1/2, 1/4, 1/4 is rolled before every turn, then the
 * player either moves by the roll (action 0) or by exactly one square (action 1). First to 6 wins.
 */
interface RaceState {
  pos: [number, number];
  toMove: number;
  roll: number | null;
  winner: number | null;
}

const GOAL = 6;
const ROLLS = [
  { action: 1, probability: 0.5 },
  { action: 2, probability: 0.25 },
  { action: 3, probability: 0.25 },
];

const raceEnv: GameEnvironment<RaceState, number> = {
  id: 'dice-race',
  version: '1.0.0',
  rulesetId: 'fixture',
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: true,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: 2,
    observationShape: [3],
  },
  createInitialState: () => ({ pos: [0, 0], toMove: 0, roll: null, winner: null }),
  reset(seed) {
    return this.createInitialState(undefined, seed);
  },
  getObservation: (s) => ({ ...s, pos: [...s.pos] }),
  getLegalActions(s, player) {
    if (s.winner !== null) return [];
    const current = player ?? this.getCurrentPlayer(s);
    if (current === CHANCE_PLAYER) return ROLLS.map((r) => r.action);
    return current === s.toMove && s.roll !== null ? [0, 1] : [];
  },
  applyAction(s, action) {
    if (!this.getLegalActions(s).includes(action)) throw new IllegalActionError(`${action}`);
    if (s.roll === null) return { ...s, pos: [...s.pos], roll: action };
    const pos: [number, number] = [...s.pos];
    const reached = pos[s.toMove]! + (action === 0 ? s.roll : 1);
    pos[s.toMove] = reached;
    const winner = reached >= GOAL ? s.toMove : null;
    return { pos, toMove: 1 - s.toMove, roll: null, winner };
  },
  getCurrentPlayer(s) {
    if (s.winner !== null) return NO_PLAYER;
    return s.roll === null ? CHANCE_PLAYER : s.toMove;
  },
  isTerminal: (s) => s.winner !== null,
  getOutcome: (s) =>
    s.winner === null
      ? null
      : {
          returns: standardReturns(2, [s.winner]),
          winners: [s.winner],
          draw: false,
          reason: 'goal',
        },
  getReward(s, p) {
    return this.getOutcome(s)?.returns[p] ?? 0;
  },
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => JSON.parse(d) as RaceState,
  cloneState: (s) => ({ ...s, pos: [...s.pos] }),
  getChanceOutcomes: () => ROLLS,
  encodeAction: (a) => a,
  decodeAction: (i) => i,
  getObservationTensor: (s, p) => ({
    shape: [3],
    data: [s.pos[p]!, s.pos[1 - p]!, s.roll ?? 0],
  }),
};

const raceBundle: AnyBundle = {
  env: raceEnv,
  agents: [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Random', es: 'Aleatorio' },
      create: () => new RandomAgent(),
    },
  ],
};

function server() {
  const s = createEnvServer({
    loadBundle: (game) => (game === 'dice-race' ? Promise.resolve(raceBundle) : loadAiBundle(game)),
    listGames: () => ['dice-race', 'tic-tac-toe', 'english-checkers'],
  });
  return {
    ...s,
    call: (msg: Message) => s.handle(msg) as Promise<Record<string, unknown>>,
  };
}

interface GymResult {
  player: number;
  terminal: boolean;
  legal: number[];
  rewards: number[];
  auto: { player: number; encoded: number | null; action: unknown }[];
  observation: number[];
  observer: number;
  outcome: { returns: number[] } | null;
}

async function playEpisode(srv: ReturnType<typeof server>, handle: number, seed: number) {
  const steps: GymResult[] = [(await srv.call({ cmd: 'gym_reset', handle, seed })) as never];
  while (!steps.at(-1)!.terminal) {
    steps.push((await srv.call({ cmd: 'gym_step', handle, action: 0 })) as never);
  }
  return steps;
}

describe('env server gym commands', () => {
  it('samples chance nodes from getChanceOutcomes with the seeded RNG', async () => {
    const srv = server();
    const { handle } = await srv.call({ cmd: 'gym_make', game: 'dice-race', seat: 0 });
    const counts = new Map<number, number>();
    for (let seed = 0; seed < 2000; seed++) {
      const r = (await srv.call({ cmd: 'gym_reset', handle, seed })) as unknown as GymResult;
      expect(r.player).toBe(0);
      expect(r.auto).toHaveLength(1);
      expect(r.auto[0]).toMatchObject({ player: CHANCE_PLAYER, encoded: null });
      const roll = r.auto[0]!.action as number;
      counts.set(roll, (counts.get(roll) ?? 0) + 1);
    }
    expect(counts.get(1)! / 2000).toBeCloseTo(0.5, 1);
    expect(counts.get(2)! / 2000).toBeCloseTo(0.25, 1);
    expect(counts.get(3)! / 2000).toBeCloseTo(0.25, 1);
  });

  it('plays opponents and chance until the controlled seat moves, reproducibly per seed', async () => {
    const srv = server();
    const { handle } = await srv.call({ cmd: 'gym_make', game: 'dice-race', seat: 1 });
    const a = await playEpisode(srv, handle as number, 42);
    const b = await playEpisode(srv, handle as number, 42);
    expect(b).toEqual(a);
    for (const step of a.slice(0, -1)) {
      expect(step.player).toBe(1);
      expect(step.observer).toBe(1);
      expect(step.legal).toEqual([0, 1]);
    }
    // Seat 0 moved before the first controlled turn: chance, seat 0, chance.
    expect(a[0]!.auto.map((m) => m.player)).toEqual([CHANCE_PLAYER, 0, CHANCE_PLAYER]);
    expect(a[0]!.auto[1]!.encoded).not.toBeNull();
    const last = a.at(-1)!;
    expect(last.legal).toEqual([]);
    expect(last.rewards).toEqual(last.outcome!.returns);
    const episodes = [];
    for (let seed = 0; seed < 10; seed++)
      episodes.push(await playEpisode(srv, handle as number, seed));
    expect(new Set(episodes.map((e) => JSON.stringify(e))).size).toBeGreaterThan(1);
  });

  it('controls every seat in self-play and observes from the seat to move', async () => {
    const srv = server();
    const { handle } = await srv.call({ cmd: 'gym_make', game: 'dice-race', seat: null });
    const steps = await playEpisode(srv, handle as number, 7);
    for (const [i, step] of steps.entries()) {
      expect(step.auto.every((m) => m.player === CHANCE_PLAYER)).toBe(true);
      if (!step.terminal) {
        expect(step.player).toBe(i % 2);
        expect(step.observer).toBe(step.player);
      }
    }
  });

  it('rejects illegal actions without changing the state', async () => {
    const srv = server();
    const { handle } = await srv.call({ cmd: 'gym_make', game: 'dice-race' });
    const before = await srv.call({ cmd: 'gym_reset', handle, seed: 3 });
    const reply = JSON.parse(
      await srv.respond(JSON.stringify({ id: 9, cmd: 'gym_step', handle, action: 5 })),
    ) as Record<string, unknown>;
    expect(reply).toMatchObject({ id: 9, ok: false, type: 'IllegalActionError' });
    const after = await srv.call({ cmd: 'gym_observe', handle });
    expect(after.observation).toEqual(before.observation);
    expect(after.legal).toEqual(before.legal);
  });

  it('validates gym_make arguments', async () => {
    const srv = server();
    await expect(srv.call({ cmd: 'gym_make', game: 'english-checkers' })).rejects.toThrow(
      /no fixed discrete action encoding/,
    );
    await expect(
      srv.call({ cmd: 'gym_make', game: 'dice-race', opponent: 'grandmaster' }),
    ).rejects.toThrow(/Unknown agent preset "grandmaster".*Available: random/);
    await expect(srv.call({ cmd: 'gym_make', game: 'dice-race', seat: 2 })).rejects.toThrow(
      /outside 0..1/,
    );
    await expect(
      srv.call({ cmd: 'gym_make', game: 'dice-race', observation: 'pixels' }),
    ).rejects.toThrow(/Unknown observation mode/);
  });

  it('runs a real engine: tic-tac-toe against its perfect preset never loses for the preset', async () => {
    const srv = server();
    const made = await srv.call({
      cmd: 'gym_make',
      game: 'tic-tac-toe',
      seat: 0,
      opponent: 'perfect',
    });
    expect(made).toMatchObject({ actionSpaceSize: 9, observationShape: [3, 3, 3], tensor: true });
    for (let seed = 0; seed < 5; seed++) {
      let r = (await srv.call({
        cmd: 'gym_reset',
        handle: made.handle,
        seed,
      })) as never as GymResult;
      while (!r.terminal) {
        expect(r.observation).toHaveLength(27);
        r = (await srv.call({
          cmd: 'gym_step',
          handle: made.handle,
          action: r.legal[0],
        })) as never as GymResult;
      }
      expect(r.rewards[0]).toBeLessThanOrEqual(0);
    }
  });
});

describe('env server protocol', () => {
  it('keeps the raw commands working', async () => {
    const srv = server();
    const made = await srv.call({ cmd: 'make', game: 'tic-tac-toe', seed: 1 });
    expect(made).toMatchObject({ handle: 0, player: 0, terminal: false });
    const stepped = await srv.call({ cmd: 'step', handle: 0, action: 4 });
    expect(stepped).toMatchObject({ mover: 0, player: 1, rewards: [0, 0] });
    expect((await srv.call({ cmd: 'legal', handle: 0 })).legal).not.toContain(4);
    await srv.call({ cmd: 'close', handle: 0 });
    expect(srv.handleCount()).toBe(0);
  });

  it('reports capabilities and load errors in the catalog', async () => {
    const srv = server();
    const rows = (await srv.handle({ cmd: 'catalog' })) as Record<string, unknown>[];
    expect(rows.map((r) => r.id)).toEqual(['dice-race', 'tic-tac-toe', 'english-checkers']);
    expect(rows[0]).toMatchObject({ encode: true, tensor: true, chanceOutcomes: true });
    expect(rows[2]).toMatchObject({ encode: false, tensor: true, actionSpaceSize: null });
    const missing = (await srv.handle({ cmd: 'catalog', games: ['nope'] })) as unknown[];
    expect(missing).toEqual([{ id: 'nope', error: 'No AI bundle registered for "nope"' }]);
  });

  it('answers batches entry by entry and reports malformed lines', async () => {
    const srv = server();
    const results = await srv.handle({
      cmd: 'batch',
      requests: [{ cmd: 'list' }, { cmd: 'nope' }, { cmd: 'close', handle: 3 }],
    });
    expect(results).toEqual([
      { ok: true, result: ['dice-race', 'tic-tac-toe', 'english-checkers'] },
      { ok: false, error: 'Unknown command nope', type: 'Error' },
      { ok: true, result: null },
    ]);
    const bad = JSON.parse(await srv.respond('{not json')) as Record<string, unknown>;
    expect(bad).toMatchObject({ id: null, ok: false, type: 'SyntaxError' });
  });
});
