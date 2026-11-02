/** Spike Hop for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import { TILE } from '../shared/platform/physics';
import {
  ACTIONS,
  ROOMS,
  VIEW_H,
  VIEW_W,
  hopperPolicy,
  isHop,
  newHop,
  plannerPolicy,
  stepHop,
  type Hop,
  type HopAction,
} from './sim';

function drawRoom(ctx: CanvasRenderingContext2D, s: Hop, reducedMotion: boolean) {
  const rows = ROOMS[s.room]!.rows;
  const at = (tx: number, ty: number) => rows[ty]?.[tx] ?? '#';
  rows.forEach((row, ty) =>
    [...row].forEach((c, tx) => {
      const x = tx * TILE;
      const y = ty * TILE;
      if (c === '#') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#475569';
        if (at(tx, ty - 1) !== '#') ctx.fillRect(x, y, TILE, 2);
        if (at(tx - 1, ty) !== '#') ctx.fillRect(x, y, 2, TILE);
        ctx.fillStyle = '#1e293b';
        if (at(tx, ty + 1) !== '#') ctx.fillRect(x, y + TILE - 2, TILE, 2);
        if (at(tx + 1, ty) !== '#') ctx.fillRect(x + TILE - 2, y, 2, TILE);
      } else if (c === '^' || c === 'v') {
        ctx.fillStyle = '#e2e8f0';
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          if (c === '^') {
            ctx.moveTo(x + k * 4, y + TILE);
            ctx.lineTo(x + k * 4 + 2, y + 6);
            ctx.lineTo(x + k * 4 + 4, y + TILE);
          } else {
            ctx.moveTo(x + k * 4, y);
            ctx.lineTo(x + k * 4 + 2, y + TILE - 6);
            ctx.lineTo(x + k * 4 + 4, y);
          }
          ctx.fill();
        }
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(x, c === '^' ? y + TILE - 2 : y, TILE, 2);
      } else if (c === 'S') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 2, y + TILE - 3, TILE - 4, 3);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          ctx.moveTo(x + 4, y + TILE - 4 - k * 2.5);
          ctx.lineTo(x + 12, y + TILE - 5 - k * 2.5);
        }
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + 1, y + 4, TILE - 2, 3);
      } else if (c === 'D') {
        const glow = reducedMotion ? 0.6 : 0.45 + 0.25 * Math.sin(s.steps / 12);
        ctx.fillStyle = `rgba(250,204,21,${glow})`;
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 6, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + TILE);
        ctx.lineTo(x + 2, y + 4);
        ctx.arc(x + 8, y + 4, 6, Math.PI, 0);
        ctx.lineTo(x + 14, y + TILE);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(x + 10, y + 9, 2, 2);
      }
    }),
  );
}

function drawHero(ctx: CanvasRenderingContext2D, s: Hop, reducedMotion: boolean) {
  const h = s.hero;
  const x = Math.round(h.x);
  const y = Math.round(h.y);
  if (s.dying > 0) {
    // A burst of sparks where the hero fell.
    const p = 1 - s.dying / 30;
    ctx.fillStyle = '#fbbf24';
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8;
      ctx.fillRect(x + 5 + Math.cos(a) * p * 16, y + 7 + Math.sin(a) * p * 16, 2, 2);
    }
    return;
  }
  // Afterimages while dashing.
  if (h.dash > 0 && !reducedMotion) {
    ctx.fillStyle = 'rgba(56,189,248,0.3)';
    for (let k = 1; k <= 3; k++)
      ctx.fillRect(x - h.dashDir[0] * k * 5, y - h.dashDir[1] * k * 5, 10, 14);
  }
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(x + 1, y + 5, 8, 6);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(x + 1, y + 11, 3, 3);
  ctx.fillRect(x + 6, y + 11, 3, 3);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(x + 2, y, 6, 5);
  ctx.fillStyle = '#111';
  ctx.fillRect(h.facing > 0 ? x + 6 : x + 3, y + 2, 1, 1);
  // The lantern: lit while a dash is in hand.
  const lx = h.facing > 0 ? x - 2 : x + 10;
  ctx.fillStyle = h.canDash ? '#facc15' : '#475569';
  ctx.fillRect(lx, y + 6, 3, 4);
  if (h.canDash) {
    ctx.fillStyle = 'rgba(250,204,21,0.25)';
    ctx.beginPath();
    ctx.arc(lx + 1.5, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const DEF: ArcadeDef<Hop, HopAction> = {
  id: 'precision-platformer',
  prefix: 'pp',
  hz: 60,
  width: VIEW_W,
  height: VIEW_H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: () => newHop(),
  step: (s, a) => stepHop(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.room', `${s.room + 1}/${ROOMS.length}`],
    ['hud.deaths', s.deaths],
    ['hud.time', Math.ceil(s.time / 60)],
  ],
  draw(ctx, s, { reducedMotion }) {
    const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    bg.addColorStop(0, '#0b1020');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawRoom(ctx, s, reducedMotion);
    drawHero(ctx, s, reducedMotion);
  },
  control(_s, held) {
    const h =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    if (held.has('alt')) {
      const up = held.has('up') ? 'up' : '';
      const dir = [up, h].filter(Boolean).join('-');
      return (dir ? `${dir}-dash` : 'dash') as HopAction;
    }
    if (held.has('fire')) return (h ? `${h}-jump` : 'jump') as HopAction;
    return (h || 'idle') as HopAction;
  },
  touch: ['left', 'right', 'up', 'fire', 'alt'],
  pointer: false,
  policies: { planner: plannerPolicy, hopper: hopperPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    jump: [{ wave: 'square', freq: 360, freqEnd: 720, duration: 0.1, gain: 0.05 }],
    'wall-jump': [{ wave: 'square', freq: 480, freqEnd: 900, duration: 0.1, gain: 0.05 }],
    dash: [{ wave: 'sawtooth', freq: 900, freqEnd: 300, duration: 0.15, gain: 0.06 }],
    spring: [{ wave: 'triangle', freq: 300, freqEnd: 1200, duration: 0.25, gain: 0.1 }],
    die: [{ wave: 'sawtooth', freq: 400, freqEnd: 80, duration: 0.35, gain: 0.1 }],
    door: [
      { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 988, duration: 0.25, delay: 0.1, gain: 0.14 },
    ],
  },
  result: (s) => ({
    outcome: s.won ? 'win' : 'complete',
    score: s.score,
    mode: 'precision-platformer',
  }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('wall-jump')) unlock('wall');
    if (s.events.includes('door') && s.room === 3) unlock('dash');
    if (s.won) unlock('win');
    if (s.won && s.deaths === 0) unlock('flawless');
  },
  ending: (s) =>
    s.won ? ['end.won', { n: s.score, d: s.deaths }] : ['end.time', { r: s.room + 1, d: s.deaths }],
  validate: (d: unknown): d is Hop => isHop(d),
  strings: {
    en: {
      title: 'Spike Hop',
      'menu.subtitle':
        'Eight rooms of spikes. Jump, kick off walls and dash in mid-air to reach each door — dying only sends you back to the room’s start.',
      'hud.room': 'Room',
      'hud.deaths': 'Deaths',
      'hud.time': 'Time',
      'control.up': 'Aim up',
      'control.fire': 'Jump',
      'control.alt': 'Dash',
      'end.won': 'All eight rooms cleared with {d} deaths — {n} points!',
      'end.time': 'Out of time in room {r} after {d} deaths.',
    },
    es: {
      title: 'Salto preciso',
      'menu.subtitle':
        'Ocho salas llenas de pinchos. Salta, impúlsate en las paredes y haz un dash en el aire para llegar a cada puerta: morir solo te devuelve al inicio de la sala.',
      'hud.room': 'Sala',
      'hud.deaths': 'Muertes',
      'hud.time': 'Tiempo',
      'control.up': 'Apuntar arriba',
      'control.fire': 'Saltar',
      'control.alt': 'Dash',
      'end.won': '¡Las ocho salas superadas con {d} muertes: {n} puntos!',
      'end.time': 'Se acabó el tiempo en la sala {r} tras {d} muertes.',
    },
  },
};
