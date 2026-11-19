/**
 * JSON-lines environment server: exposes registered game environments over stdin/stdout so that
 * offline trainers (training/arcade_ai/) use the exact TypeScript rules engines.
 *
 * Request:  {"id": 1, "cmd": "make", "game": "tic-tac-toe", "seed": 7, "config": {...}}
 * Response: {"id": 1, "ok": true, "result": {...}}  or  {"id": 1, "ok": false, "error": "...",
 *           "type": "IllegalActionError"}
 *
 * Raw commands: info, list, catalog, make, reset, observe, legal, step, serialize, restore, close.
 * Gym commands: gym_make, gym_reset, gym_step, gym_observe. Batching: batch.
 * See tools/env-server-core.ts for the semantics of each command.
 *
 * Requests are answered strictly in arrival order, one response line per request line.
 */
import { createInterface } from 'node:readline';
import { createEnvServer } from './env-server-core';

const server = createEnvServer();
const rl = createInterface({ input: process.stdin });
let queue: Promise<void> = Promise.resolve();

rl.on('line', (line) => {
  if (!line.trim()) return;
  queue = queue.then(async () => {
    process.stdout.write(`${await server.respond(line)}\n`);
  });
});
