import { describe, expect, it } from 'vitest';
import { loadAiBundle } from '../registry';

describe('loadAiBundle', () => {
  it('loads a registered game', async () => {
    const bundle = await loadAiBundle('tic-tac-toe');
    expect(bundle.env.id).toBe('tic-tac-toe');
  });

  it.each(['missing-game', 'constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'rejects the unregistered id "%s"',
    async (id) => {
      await expect(loadAiBundle(id)).rejects.toThrow('No AI bundle registered');
    },
  );
});
