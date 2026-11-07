import { describe, expect, it } from 'vitest';
import { RandomAgent } from '../agents/random-agent';
import type { Agent } from '../agents/types';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../protocols/types';
import { evaluateAgents } from './evaluate';

const WON: Outcome = { returns: [1], winners: [0], draw: false, reason: 'up' };
const LOST: Outcome = { returns: [0], winners: [], draw: false, reason: 'down' };

/** A one-player race to 3: "up" adds one, "down" loses at once. */
type S = { n: number; lost: boolean };
const env: GameEnvironment<S, string> = {
  id: 'solo-test',
  version: '1.0.0',
  rulesetId: 'solo',
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: () => ({ n: 0, lost: false }),
  reset: () => ({ n: 0, lost: false }),
  getObservation: (s) => s,
  getLegalActions: (s) => (s.n >= 3 || s.lost ? [] : ['up', 'down']),
  applyAction: (s, a) => (a === 'up' ? { ...s, n: s.n + 1 } : { ...s, lost: true }),
  getCurrentPlayer: (s) => (s.n >= 3 || s.lost ? NO_PLAYER : 0),
  isTerminal: (s) => s.n >= 3 || s.lost,
  getOutcome: (s): Outcome | null => (s.n >= 3 ? WON : s.lost ? LOST : null),
  getReward: () => 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => JSON.parse(d) as S,
  cloneState: (s) => ({ ...s }),
};

const climber: Agent<S, string> = { id: 'up', label: 'Up', selectAction: () => 'up' };

describe('single-player evaluation', () => {
  it('plays each agent alone on the same deals and counts solved ones as wins', () => {
    const report = evaluateAgents(env, climber, new RandomAgent(), { games: 20, seed: 1 });
    expect(report.agents[0].wins).toBe(20);
    expect(report.agents[0].losses).toBe(0);
    expect(report.agents[1].wins + report.agents[1].losses).toBe(20);
    expect(report.agents[1].wins).toBeLessThan(20);
    expect(report.swapSeats).toBe(false);
  });
});
