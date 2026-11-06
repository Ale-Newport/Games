/// <reference lib="webworker" />
import { loadAiBundle } from '../adapters/registry';
import { evaluateAgents } from './evaluate';
import type { EvaluateRequest, WorkerMessage } from './protocol';

const post = (message: WorkerMessage) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(message);

self.onmessage = async (event: MessageEvent<EvaluateRequest>) => {
  const request = event.data;
  try {
    const bundle = await loadAiBundle(request.gameId);
    const presetA = bundle.agents.find((a) => a.id === request.agentA);
    const presetB = bundle.agents.find((a) => a.id === request.agentB);
    if (!presetA || !presetB) throw new Error('Unknown agent');
    let lastPost = 0;
    const report = evaluateAgents(bundle.env, presetA.create(), presetB.create(), {
      games: request.games,
      seed: request.seed,
      timeLimitMs: request.timeLimitMs,
      onProgress: (completed, total) => {
        const now = performance.now();
        if (now - lastPost > 100 || completed === total) {
          lastPost = now;
          post({ type: 'progress', completed, total });
        }
      },
    });
    post({ type: 'done', report });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
