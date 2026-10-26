import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { STYLES, styleAction } from '../../shared/poker/ai';
import { applyPokerAction, createPoker } from '../../shared/poker/engine';
import { AGENT_PRESETS } from '../ai';
import { bundle, holdemEnv } from '../ai-adapter';
import { manifest } from '../manifest';
import { VARIANT } from '../rules';

describe("Texas Hold'em module", () => {
  it('wires the no-limit variant into the environment and the presets', () => {
    expect(VARIANT).toMatchObject({ id: 'holdem', hole: 2, limit: 'no-limit' });
    expect(holdemEnv.id).toBe(manifest.id);
    expect(holdemEnv.version).toBe(manifest.version);
    expect(bundle.agents.map((a) => a.id)).toEqual(['random', 'easy', 'medium', 'hard']);
    expect(AGENT_PRESETS).toBe(bundle.agents);
    const s = holdemEnv.reset(3);
    expect(s.seats).toHaveLength(2);
    expect(s.seats.every((x) => x.hole.length === 2)).toBe(true);
  });

  it('reads an all-in as strength: Medium folds junk and calls with aces', () => {
    const shove = (hole: number[]) => {
      const s = createPoker(VARIANT, 12, 2);
      s.seats[1]!.hole = hole;
      return applyPokerAction(s, 'raise:1500');
    };
    const rng = new Rng(4);
    expect(styleAction(shove([c(CLUBS, 7), c(DIAMONDS, 2)]), STYLES.medium, rng)).toBe('fold');
    expect(styleAction(shove([c(SPADES, 1), c(HEARTS, 1)]), STYLES.medium, rng)).toBe('call');
  });
});
