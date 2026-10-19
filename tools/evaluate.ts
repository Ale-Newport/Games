/**
 * CLI evaluation: npm run evaluate -- <game> <agentA> <agentB> [games=100] [seed=1]
 * Prints the full EvaluationReport as JSON (redirect to a file to keep it).
 */
import { loadAiBundle } from '../src/ai/adapters/registry';
import { evaluateAgents } from '../src/ai/evaluation/evaluate';

const [game, a, b, games = '100', seed = '1'] = process.argv.slice(2);
if (!game || !a || !b) {
  console.error('Usage: npm run evaluate -- <game> <agentA> <agentB> [games] [seed]');
  process.exit(2);
}
const bundle = await loadAiBundle(game);
const find = (id: string) => {
  const preset = bundle.agents.find((p) => p.id === id);
  if (!preset) {
    console.error(`Unknown agent "${id}". Available: ${bundle.agents.map((p) => p.id).join(', ')}`);
    process.exit(2);
  }
  return preset.create();
};
const report = evaluateAgents(bundle.env, find(a), find(b), {
  games: Number(games),
  seed: Number(seed),
});
console.log(JSON.stringify(report, null, 2));
