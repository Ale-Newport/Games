/** The two rule sets: the classic two-wall game and the enhanced five-wall game with capsules. */
import type { BrickRules } from './sim';

const FULL = '1111111111';

export const BREAKOUT: BrickRules = {
  id: 'breakout',
  // The classic wall, eight rows of ten, played twice.
  walls: [new Array(8).fill(FULL), new Array(8).fill(FULL)],
  lives: 3,
  rowPoints: [7, 7, 5, 5, 3, 3, 1, 1],
  capsules: false,
  startSpeed: 4,
  maxSpeed: 7.5,
  shrink: true,
};

export const ENHANCED: BrickRules = {
  id: 'brick-breaker',
  walls: [
    ['2222222222', '1111111111', '1111111111', '1111111111', '1111111111', '1111111111'],
    ['..333333..', '.22222222.', '1111111111', '11G1111G11', '1111111111', '.11111111.'],
    ['3.3.3.3.3.', '.2.2.2.2.2', '1111111111', 'G1G1G1G1G1', '2222222222', '1111111111'],
    [
      '1111111111',
      '1........1',
      '1.333333.1',
      '1.3GGGG3.1',
      '1.333333.1',
      '1........1',
      '1111111111',
    ],
    [
      '3333333333',
      '2222222222',
      'G11111111G',
      '2222222222',
      '1111111111',
      '33GG11GG33',
      '1111111111',
    ],
  ],
  lives: 3,
  rowPoints: [10, 10, 8, 8, 6, 6, 4, 4],
  capsules: true,
  startSpeed: 4.2,
  maxSpeed: 8,
  shrink: false,
};
