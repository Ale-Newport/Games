/** Invaders from Above for the shared arcade shell: original pixel sprites, controls, sounds, results. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  ALIEN_H,
  ALIEN_W,
  COLS,
  H,
  PLAYER_W,
  PLAYER_Y,
  ROWS,
  W,
  alienX,
  alienY,
  gunnerPolicy,
  isInvaders,
  newInvaders,
  stepInvaders,
  sweeperPolicy,
  type InvAction,
  type Invaders,
} from './sim';

/** Original 8 × 6 sprites (two marching frames each) for the three ranks; '#' is a pixel. */
const SPRITES: string[][] = [
  ['..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#'],
  ['..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.'],
  ['.#....#.', '..####..', '.##.##.#', '########', '#.####.#', '..#..#..'],
  ['.#....#.', '#.####.#', '#.#.##.#', '########', '..####..', '.#....#.'],
  ['...##...', '.######.', '##.##.##', '########', '.##..##.', '##....##'],
  ['...##...', '.######.', '##.##.##', '########', '..#..#..', '.#....#.'],
];
const RANK_COLOURS = ['#ff8fb1', '#7c5cff', '#7c5cff', '#5aa9e6', '#5aa9e6'];

function sprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  colour: string,
) {
  const px = w / rows[0]!.length;
  const py = h / rows.length;
  ctx.fillStyle = colour;
  rows.forEach((row, r) =>
    [...row].forEach(
      (ch, c) => ch === '#' && ctx.fillRect(x + c * px, y + r * py, px + 0.3, py + 0.3),
    ),
  );
}

export const INVADERS: ArcadeDef<Invaders, InvAction> = {
  id: 'invaders',
  prefix: 'iv',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newInvaders(seed),
  step: stepInvaders,
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.wave', s.wave],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, W, H);
    // Stars.
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 40; i++)
      ctx.fillRect(
        (i * 97) % W,
        (i * 53 + (reducedMotion ? 0 : s.steps * 0.05 * (1 + (i % 3)))) % H,
        1,
        1,
      );
    ctx.fillStyle = '#30a46c';
    for (const k of s.shields) {
      const [x, y] = k.split(',').map(Number) as [number, number];
      ctx.fillRect(x, y, 4, 4);
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (s.alive[r * COLS + c]) {
          const rank = r === 0 ? 2 : r < 3 ? 1 : 0;
          sprite(
            ctx,
            SPRITES[rank * 2 + s.frame]!,
            alienX(s, c),
            alienY(s, r),
            ALIEN_W,
            ALIEN_H,
            RANK_COLOURS[r]!,
          );
        }
    if (s.ufo) {
      ctx.fillStyle = '#e5484d';
      ctx.beginPath();
      ctx.ellipse(s.ufo.x, 44, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb3b3';
      ctx.beginPath();
      ctx.ellipse(s.ufo.x, 39, 6, 4, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#f1c40f';
    for (const b of s.bombs) {
      const wiggle = reducedMotion ? 0 : Math.sin((b.y + b.kind * 3) / 4) * 1.5;
      ctx.fillRect(b.x - 1 + wiggle, b.y - 6, 2, 3);
      ctx.fillRect(b.x - 1 - wiggle, b.y - 3, 2, 3);
    }
    if (s.shot) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.shot.x - 1, s.shot.y, 2, 8);
    }
    if (s.dying > 0) {
      ctx.fillStyle = s.dying % 10 < 5 ? '#e5484d' : '#f1c40f';
      ctx.fillRect(s.player - PLAYER_W / 2, PLAYER_Y, PLAYER_W, 8);
    } else {
      ctx.fillStyle = '#e6f2ea';
      ctx.fillRect(s.player - PLAYER_W / 2, PLAYER_Y + 3, PLAYER_W, 6);
      ctx.fillRect(s.player - 3, PLAYER_Y - 2, 6, 6);
      ctx.fillRect(s.player - 1, PLAYER_Y - 5, 2, 4);
    }
    ctx.fillStyle = 'rgba(48,164,108,0.6)';
    ctx.fillRect(0, H - 8, W, 2);
  },
  control(_s, held) {
    const fire = held.has('fire') || held.has('up');
    const l = held.has('left') && !held.has('right');
    const r = held.has('right') && !held.has('left');
    if (l) return fire ? 'left-fire' : 'left';
    if (r) return fire ? 'right-fire' : 'right';
    return fire ? 'fire' : 'idle';
  },
  touch: ['left', 'fire', 'right'],
  pointer: false,
  policies: { gunner: gunnerPolicy, sweeper: sweeperPolicy },
  sounds(_prev, next) {
    return next.events.filter((e) => e !== 'march' || next.steps % 2 === 0);
  },
  soundBank: {
    shoot: [{ wave: 'square', freq: 880, freqEnd: 440, duration: 0.06, gain: 0.05 }],
    kill: [{ wave: 'noise', freq: 0, duration: 0.1, gain: 0.08, lowpass: 2600 }],
    march: [{ wave: 'square', freq: 90, duration: 0.05, gain: 0.05 }],
    ufo: [{ wave: 'sine', freq: 600, freqEnd: 900, duration: 0.3, gain: 0.05 }],
    'ufo-hit': [
      { wave: 'triangle', freq: 880, duration: 0.08, gain: 0.12 },
      { wave: 'triangle', freq: 1320, duration: 0.14, delay: 0.08, gain: 0.12 },
    ],
    hit: [{ wave: 'sawtooth', freq: 220, freqEnd: 60, duration: 0.6, gain: 0.1 }],
    extra: [{ wave: 'triangle', freq: 990, duration: 0.2, gain: 0.12 }],
    wave: [
      { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.16, delay: 0.09, gain: 0.14 },
    ],
    over: [
      { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
      { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
    ],
    invaded: [{ wave: 'sawtooth', freq: 200, freqEnd: 50, duration: 0.8, gain: 0.1 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'classic' }),
  achievements(s, _o, unlock) {
    unlock('first');
    if (s.wave >= 2) unlock('wave');
    if (s.wave >= 4) unlock('veteran');
    if (s.score >= 3000) unlock('score');
  },
  ending: (s) => [
    s.events.includes('invaded') ? 'end.invaded' : 'end.over',
    { n: s.score, w: s.wave },
  ],
  validate: isInvaders,
  strings: {
    en: {
      title: 'Invaders from Above',
      'menu.subtitle':
        'Hold the line: a marching formation drops bombs as it closes in. Hide behind the shields, pick off the invaders, and catch the mystery ship for big points.',
      'hud.score': 'Score',
      'hud.lives': 'Cannons',
      'hud.wave': 'Wave',
      'end.over': 'Game over on wave {w}: {n} points.',
      'end.invaded': 'The invaders landed on wave {w}: {n} points.',
    },
    es: {
      title: 'Invasores del cielo',
      'menu.subtitle':
        'Aguanta la línea: una formación que marcha suelta bombas mientras se acerca. Protégete tras los escudos, derriba a los invasores y caza la nave misteriosa para sumar muchos puntos.',
      'hud.score': 'Puntos',
      'hud.lives': 'Cañones',
      'hud.wave': 'Oleada',
      'end.over': 'Fin de la partida en la oleada {w}: {n} puntos.',
      'end.invaded': 'Los invasores aterrizaron en la oleada {w}: {n} puntos.',
    },
  },
};
