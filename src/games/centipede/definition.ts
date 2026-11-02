/** Garden Guard for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  CELL,
  COLS,
  H,
  PATCH,
  ROWS,
  W,
  gunnerPolicy,
  isGuard,
  newGuard,
  sprinklerPolicy,
  stepGuard,
  type Guard,
  type GuardAction,
} from './sim';

const SEG_COLOURS = ['#84cc16', '#65a30d'];

export const DEF: ArcadeDef<Guard, GuardAction> = {
  id: 'centipede',
  prefix: 'gg',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newGuard(seed),
  step: (s, a) => stepGuard(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.wave', s.wave],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, PATCH * CELL, W, H - PATCH * CELL);
    // Grass tufts, fixed.
    ctx.fillStyle = '#3f6212';
    for (let i = 0; i < 70; i++) ctx.fillRect((i * 37) % W, (i * 71) % H, 1, 3);
    // Stones: grey pebbles, smaller as they wear.
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const hp = s.stones[r * COLS + c]!;
        if (!hp) continue;
        const size = 1.5 + hp;
        ctx.fillStyle = hp === 3 ? '#a8a29e' : hp === 2 ? '#78716c' : '#57534e';
        ctx.beginPath();
        ctx.ellipse((c + 0.5) * CELL, (r + 0.5) * CELL, size, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    // The caterpillar.
    s.segments.forEach((g, i) => {
      const x = (g.c + 0.5) * CELL;
      const y = (g.r + 0.5) * CELL;
      ctx.fillStyle = g.head ? '#facc15' : SEG_COLOURS[i % 2]!;
      ctx.beginPath();
      ctx.arc(x, y, 3.8, 0, Math.PI * 2);
      ctx.fill();
      if (g.head) {
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + g.dx * 1.5 - 0.5, y - 2, 1.2, 1.2);
        ctx.fillRect(x + g.dx * 1.5 - 0.5, y + 1, 1.2, 1.2);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + g.dx * 2, y - 3);
        ctx.lineTo(x + g.dx * 4, y - 6);
        ctx.moveTo(x + g.dx * 2, y + 3);
        ctx.lineTo(x + g.dx * 4, y + 6);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#365314';
        ctx.fillRect(x - 0.5, y - 3.5, 1, 7);
      }
    });
    if (s.beetle) {
      const b = s.beetle;
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 0.8;
      const wiggle = reducedMotion ? 0 : Math.sin(s.steps / 3) * 2;
      ctx.beginPath();
      for (const k of [-3, 0, 3]) {
        ctx.moveTo(b.x + k, b.y - 4);
        ctx.lineTo(b.x + k + wiggle, b.y - 7);
        ctx.moveTo(b.x + k, b.y + 4);
        ctx.lineTo(b.x + k - wiggle, b.y + 7);
      }
      ctx.stroke();
    }
    if (s.acorn) {
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(s.acorn.x, s.acorn.y + 1, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(s.acorn.x - 3.5, s.acorn.y - 3, 7, 2.5);
    }
    if (s.shot) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(s.shot.x - 1, s.shot.y - 3, 2, 5);
    }
    // The gardener: green hat, blue overalls, a hose nozzle.
    if (s.dying > 0) ctx.globalAlpha = Math.max(0.2, s.dying / 90);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(s.x - 3, s.y - 1, 6, 5);
    ctx.fillStyle = '#f5d0a9';
    ctx.fillRect(s.x - 2, s.y - 4, 4, 3);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(s.x - 4, s.y - 6, 8, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(s.x - 0.5, s.y - 9, 1.5, 4);
    ctx.globalAlpha = 1;
  },
  control(s, held, pointer) {
    if (pointer) {
      const dx = Math.abs(pointer.x - s.x) > 3 ? Math.sign(pointer.x - s.x) : 0;
      const dy = Math.abs(pointer.y - s.y) > 3 ? Math.sign(pointer.y - s.y) : 0;
      const v = dy < 0 ? 'up' : dy > 0 ? 'down' : '';
      const h = dx < 0 ? 'left' : dx > 0 ? 'right' : '';
      const d = [v, h].filter(Boolean).join('-');
      return (d ? `${d}-fire` : 'fire') as GuardAction;
    }
    const v = held.has('up') ? 'up' : held.has('down') ? 'down' : '';
    const h =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    const d = [v, h].filter(Boolean).join('-');
    const f = held.has('fire');
    if (!d) return f ? 'fire' : 'idle';
    return (f ? `${d}-fire` : d) as GuardAction;
  },
  touch: ['left', 'up', 'down', 'right', 'fire'],
  pointer: true,
  policies: { gunner: gunnerPolicy, sprinkler: sprinklerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    squirt: [{ wave: 'triangle', freq: 1400, freqEnd: 900, duration: 0.04, gain: 0.03 }],
    segment: [{ wave: 'square', freq: 520, duration: 0.05, gain: 0.05 }],
    head: [{ wave: 'square', freq: 780, freqEnd: 1040, duration: 0.1, gain: 0.07 }],
    stone: [{ wave: 'triangle', freq: 200, duration: 0.03, gain: 0.03 }],
    beetle: [{ wave: 'triangle', freq: 660, freqEnd: 1320, duration: 0.2, gain: 0.1 }],
    acorn: [{ wave: 'triangle', freq: 440, freqEnd: 880, duration: 0.15, gain: 0.08 }],
    hurt: [{ wave: 'sawtooth', freq: 400, freqEnd: 60, duration: 0.8, gain: 0.1 }],
    wave: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.25, delay: 0.12, gain: 0.14 },
    ],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'centipede' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('head')) unlock('head');
    if (s.events.includes('beetle')) unlock('beetle');
    if (s.events.includes('wave')) unlock('wave');
    if (s.score >= 15000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, w: s.wave }],
  validate: (d: unknown): d is Guard => isGuard(d),
  strings: {
    en: {
      title: 'Garden Guard',
      'menu.subtitle':
        'A caterpillar is winding down through the garden stones. Squirt it segment by segment before it reaches you.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.wave': 'Wave',
      'control.fire': 'Squirt',
      'end.over': 'The garden is overrun on wave {w}: {n} points.',
    },
    es: {
      title: 'Guardián del huerto',
      'menu.subtitle':
        'Una oruga baja serpenteando entre las piedras del huerto. Mójala segmento a segmento antes de que te alcance.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.wave': 'Oleada',
      'control.fire': 'Regar',
      'end.over': 'El huerto ha caído en la oleada {w}: {n} puntos.',
    },
  },
};
