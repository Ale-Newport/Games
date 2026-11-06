import type { EvaluationReport } from './evaluate';

export interface EvaluateRequest {
  type: 'evaluate';
  gameId: string;
  agentA: string;
  agentB: string;
  games: number;
  seed: number;
  timeLimitMs?: number;
}

export type WorkerMessage =
  | { type: 'progress'; completed: number; total: number }
  | { type: 'done'; report: EvaluationReport }
  | { type: 'error'; message: string };
