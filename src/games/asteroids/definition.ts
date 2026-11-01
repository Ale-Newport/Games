/** Space Rocks for the shared arcade shell: vector drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  ROCK_R,
  SHIP_R,
  W,
  isRocks,
  newRocks,
  pilotPolicy,
  stepRocks,
  turretPolicy,
  type RockAction,
  type Rocks,
} from './sim';

/** A rock's outline: ten points with radii fixed by its shape number. */
function outline(shape: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const jag = 0.72 + (((shape * 9301 + i * 49297) % 233280) / 233280) * 0.36;
    const a = (i / 10) * Math.PI * 2;
    pts.push([Math.cos(a) * r * jag, Math.sin(a) * r * jag]);
  }
  return pts;
}

/** Draws at every wrapped copy that may be visible near an edge. */
function wrapped(x: number, y: number, r: number, f: (x: number, y: number) => void) {
  for (const dx of [-W, 0, W])
    for (const dy of [-H, 0, H])
      if (x + dx > -r && x + dx < W + r && y + dy > -r && y + dy < H + r) f(x + dx, y + dy);
}

export const ROCKS: ArcadeDef<Rocks, RockAction> = {
  id: 'asteroids',
  prefix: 'sr2',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newRocks(seed),
  step: stepRocks,
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.level', s.level],
  ],
  draw(ctx, s) {
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#cfd6e6';
    for (const r of s.rocks) {
      const pts = outline(r.shape, ROCK_R[r.size]!);
      wrapped(r.x, r.y, ROCK_R[r.size]!, (x, y) => {
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)));
        ctx.closePath();
        ctx.stroke();
      });
    }
    if (s.saucer) {
      const { x, y } = s.saucer;
      ctx.strokeStyle = '#e5484d';
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2);
      ctx.moveTo(x - 5, y - 3);
      ctx.lineTo(x - 3, y - 7);
      ctx.lineTo(x + 3, y - 7);
      ctx.lineTo(x + 5, y - 3);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    for (const p of s.shots) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    ctx.fillStyle = '#ff8f8f';
    for (const p of s.saucerShots) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    if (s.respawn === 0) {
      const { x, y, a } = s.ship;
      const blink = s.shield > 0 && Math.floor(s.steps / 6) % 2 === 0;
      ctx.strokeStyle = blink ? 'rgba(124,92,255,0.5)' : '#7c5cff';
      wrapped(x, y, SHIP_R, (cx, cy) => {
        const p = (ang: number, r: number): [number, number] => [
          cx + Math.cos(a + ang) * r,
          cy + Math.sin(a + ang) * r,
        ];
        ctx.beginPath();
        ctx.moveTo(...p(0, SHIP_R + 3));
        ctx.lineTo(...p(2.5, SHIP_R));
        ctx.lineTo(...p(Math.PI, SHIP_R * 0.4));
        ctx.lineTo(...p(-2.5, SHIP_R));
        ctx.closePath();
        ctx.stroke();
        if (s.thrusting && s.steps % 4 < 2) {
          ctx.strokeStyle = '#f1c40f';
          ctx.beginPath();
          ctx.moveTo(...p(2.8, SHIP_R * 0.7));
          ctx.lineTo(...p(Math.PI, SHIP_R + 6));
          ctx.lineTo(...p(-2.8, SHIP_R * 0.7));
          ctx.stroke();
          ctx.strokeStyle = '#7c5cff';
        }
      });
    }
  },
  control(_s, held) {
    if (held.has('alt')) return 'h';
    const turn =
      held.has('left') && !held.has('right')
        ? 'l'
        : held.has('right') && !held.has('left')
          ? 'r'
          : '';
    const a = `${turn}${held.has('up') ? 't' : ''}${held.has('fire') ? 'f' : ''}`;
    return (a || 'idle') as RockAction;
  },
  touch: ['left', 'right', 'up', 'fire', 'alt'],
  pointer: false,
  policies: { pilot: pilotPolicy, turret: turretPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    shoot: [{ wave: 'square', freq: 1200, freqEnd: 500, duration: 0.05, gain: 0.04 }],
    boom: [{ wave: 'noise', freq: 0, duration: 0.15, gain: 0.08, lowpass: 1800 }],
    'boom-large': [{ wave: 'noise', freq: 0, duration: 0.3, gain: 0.1, lowpass: 900 }],
    saucer: [{ wave: 'square', freq: 700, freqEnd: 900, duration: 0.3, gain: 0.04 }],
    'saucer-shot': [{ wave: 'square', freq: 900, freqEnd: 400, duration: 0.06, gain: 0.04 }],
    'saucer-down': [
      { wave: 'noise', freq: 0, duration: 0.2, gain: 0.1, lowpass: 2400 },
      { wave: 'triangle', freq: 1320, duration: 0.12, delay: 0.1, gain: 0.1 },
    ],
    hyper: [{ wave: 'sine', freq: 300, freqEnd: 1500, duration: 0.25, gain: 0.08 }],
    crash: [{ wave: 'sawtooth', freq: 200, freqEnd: 50, duration: 0.7, gain: 0.1 }],
    extra: [{ wave: 'triangle', freq: 990, duration: 0.2, gain: 0.12 }],
    level: [
      { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.16, delay: 0.09, gain: 0.14 },
    ],
    over: [
      { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
      { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
    ],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'classic' }),
  achievements(s, _o, unlock) {
    unlock('first');
    if (s.level >= 2) unlock('field');
    if (s.level >= 5) unlock('deep');
    if (s.score >= 10000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, w: s.level }],
  validate: isRocks,
  strings: {
    en: {
      title: 'Space Rocks',
      'menu.subtitle':
        'Drift, turn and blast: big rocks split into smaller, faster ones, saucers shoot back, and hyperspace is a gamble. The field wraps at every edge.',
      'hud.score': 'Score',
      'hud.lives': 'Ships',
      'hud.level': 'Field',
      'end.over': 'Game over in field {w}: {n} points.',
    },
    es: {
      title: 'Rocas espaciales',
      'menu.subtitle':
        'Derrapa, gira y dispara: las rocas grandes se parten en otras más pequeñas y rápidas, los platillos responden al fuego y el hiperespacio es una apuesta. El campo da la vuelta por todos los bordes.',
      'hud.score': 'Puntos',
      'hud.lives': 'Naves',
      'hud.level': 'Campo',
      'end.over': 'Fin de la partida en el campo {w}: {n} puntos.',
    },
  },
};
