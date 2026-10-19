// Runs the unit tests of a single game: npm run test:game -- tic-tac-toe
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const id = process.argv[2];
if (!id) {
  console.error('Usage: npm run test:game -- <game-id>');
  process.exit(2);
}
const dir = `src/games/${id}`;
if (!existsSync(dir)) {
  console.error(`No game directory ${dir}`);
  process.exit(2);
}
const result = spawnSync('npx', ['vitest', 'run', dir], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
