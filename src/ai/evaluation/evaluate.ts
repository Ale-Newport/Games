import type { Agent } from '../agents/types';
import type { GameEnvironment } from '../protocols/types';
import { playMatch } from './match';

export interface EvaluationConfig<C> {
  games: number;
  /** Base seed; game i uses seed + i. */
  seed: number;
  /** Alternate seats every game so neither agent always moves first. Default true. */
  swapSeats?: boolean;
  config?: C;
  maxSteps?: number;
  timeLimitMs?: number;
  now?: () => number;
  onProgress?: (completed: number, total: number) => void;
}

export interface AgentSummary {
  id: string;
  label: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  lossRate: number;
  drawRate: number;
  averageReturn: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  averageNodes: number | null;
}

/**
 * Reproducible head-to-head evaluation record. Every field needed to reproduce the run is stored:
 * game version, ruleset, agents, seeds and configuration.
 */
export interface EvaluationReport {
  gameId: string;
  gameVersion: string;
  rulesetId: string;
  agents: [AgentSummary, AgentSummary];
  games: number;
  truncatedGames: number;
  averageMoves: number;
  seed: number;
  seeds: number[];
  swapSeats: boolean;
  timeLimitMs: number | null;
  createdAt: string;
}

/**
 * Evaluates agent A against agent B in a two-seat environment (or, with more seats, the two
 * agents in alternate seats, each scored by the mean return of its seats). In a single-player environment
 * (solitaire, puzzles) both agents play every deal on their own, on the same seeds, and their
 * results are compared: a win is a solved deal, a loss an unsolved (or truncated) one.
 */
export function evaluateAgents<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  agentA: Agent<S, A>,
  agentB: Agent<S, A>,
  config: EvaluationConfig<C>,
): EvaluationReport {
  if (env.info.maxPlayers === 1) return evaluateSolo(env, agentA, agentB, config);
  const swap = config.swapSeats ?? true;
  const tallies = [newTally(), newTally()];
  let totalMoves = 0;
  let truncated = 0;
  const seeds: number[] = [];

  for (let i = 0; i < config.games; i++) {
    const seed = (config.seed + i) >>> 0;
    seeds.push(seed);
    const aSeat = swap && i % 2 === 1 ? 1 : 0;
    // Environments for more players seat the two agents alternately (A B A B, then B A B A).
    const seatCount = Math.max(2, env.info.minPlayers);
    const seats = Array.from({ length: seatCount }, (_, s) =>
      (s + aSeat) % 2 === 0 ? agentA : agentB,
    );
    const result = playMatch(env, seats, {
      seed,
      config: config.config,
      maxSteps: config.maxSteps,
      timeLimitMs: config.timeLimitMs,
      now: config.now,
    });
    totalMoves += result.actions.length;
    if (result.truncated) truncated++;
    if (seatCount > 2) {
      // Each agent's result is the mean return of its seats; the higher mean wins.
      const own = (agentIndex: number) =>
        seats.flatMap((_, s) => ((s + aSeat) % 2 === agentIndex ? [s] : []));
      const means = [0, 1].map((k) => mean(own(k).map((s) => result.outcome?.returns[s] ?? 0)));
      [0, 1].forEach((k) => {
        const tally = tallies[k]!;
        tally.returns += means[k]!;
        if (!result.outcome || means[0] === means[1]) tally.draws++;
        else if (means[k]! > means[1 - k]!) tally.wins++;
        else tally.losses++;
        for (const s of own(k)) {
          tally.latencies.push(...(result.latencies[s] ?? []));
          tally.nodes.push(...(result.nodes[s] ?? []));
        }
      });
    } else
      for (const [agentIndex, seat] of [
        [0, aSeat],
        [1, 1 - aSeat],
      ] as const) {
        const tally = tallies[agentIndex]!;
        const ret = result.outcome?.returns[seat] ?? 0;
        tally.returns += ret;
        if (!result.outcome || result.outcome.draw || ret === 0) tally.draws++;
        else if (ret > 0) tally.wins++;
        else tally.losses++;
        tally.latencies.push(...(result.latencies[seat] ?? []));
        tally.nodes.push(...(result.nodes[seat] ?? []));
      }
    config.onProgress?.(i + 1, config.games);
  }

  const summarize = (agent: Agent<S, A>, tally: Tally): AgentSummary => ({
    id: agent.id,
    label: agent.label,
    wins: tally.wins,
    losses: tally.losses,
    draws: tally.draws,
    winRate: tally.wins / config.games,
    lossRate: tally.losses / config.games,
    drawRate: tally.draws / config.games,
    averageReturn: tally.returns / config.games,
    averageLatencyMs: mean(tally.latencies),
    maxLatencyMs: max(tally.latencies),
    averageNodes: tally.nodes.length ? mean(tally.nodes) : null,
  });

  return {
    gameId: env.id,
    gameVersion: env.version,
    rulesetId: env.rulesetId,
    agents: [summarize(agentA, tallies[0]!), summarize(agentB, tallies[1]!)],
    games: config.games,
    truncatedGames: truncated,
    averageMoves: totalMoves / Math.max(1, config.games),
    seed: config.seed,
    seeds,
    swapSeats: swap,
    timeLimitMs: config.timeLimitMs ?? null,
    createdAt: new Date().toISOString(),
  };
}

function evaluateSolo<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  agentA: Agent<S, A>,
  agentB: Agent<S, A>,
  config: EvaluationConfig<C>,
): EvaluationReport {
  const agents = [agentA, agentB] as const;
  const tallies = [newTally(), newTally()];
  let totalMoves = 0;
  let truncated = 0;
  const seeds: number[] = [];
  for (let i = 0; i < config.games; i++) {
    const seed = (config.seed + i) >>> 0;
    seeds.push(seed);
    agents.forEach((agent, k) => {
      const result = playMatch(env, [agent], {
        seed,
        config: config.config,
        maxSteps: config.maxSteps,
        timeLimitMs: config.timeLimitMs,
        now: config.now,
      });
      totalMoves += result.actions.length / 2;
      if (result.truncated) truncated++;
      const tally = tallies[k]!;
      tally.returns += result.outcome?.returns[0] ?? 0;
      if (result.outcome?.winners.includes(0)) tally.wins++;
      else tally.losses++;
      tally.latencies.push(...(result.latencies[0] ?? []));
      tally.nodes.push(...(result.nodes[0] ?? []));
    });
    config.onProgress?.(i + 1, config.games);
  }
  const summarize = (agent: Agent<S, A>, tally: Tally): AgentSummary => ({
    id: agent.id,
    label: agent.label,
    wins: tally.wins,
    losses: tally.losses,
    draws: 0,
    winRate: tally.wins / config.games,
    lossRate: tally.losses / config.games,
    drawRate: 0,
    averageReturn: tally.returns / config.games,
    averageLatencyMs: mean(tally.latencies),
    maxLatencyMs: max(tally.latencies),
    averageNodes: tally.nodes.length ? mean(tally.nodes) : null,
  });
  return {
    gameId: env.id,
    gameVersion: env.version,
    rulesetId: env.rulesetId,
    agents: [summarize(agentA, tallies[0]!), summarize(agentB, tallies[1]!)],
    games: config.games,
    truncatedGames: truncated,
    averageMoves: totalMoves / Math.max(1, config.games),
    seed: config.seed,
    seeds,
    swapSeats: false,
    timeLimitMs: config.timeLimitMs ?? null,
    createdAt: new Date().toISOString(),
  };
}

interface Tally {
  wins: number;
  losses: number;
  draws: number;
  returns: number;
  latencies: number[];
  nodes: number[];
}

function newTally(): Tally {
  return { wins: 0, losses: 0, draws: 0, returns: 0, latencies: [], nodes: [] };
}

/** Largest value (0 when empty), without spreading huge arrays into Math.max. */
function max(values: number[]): number {
  let m = 0;
  for (const v of values) if (v > m) m = v;
  return m;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}
