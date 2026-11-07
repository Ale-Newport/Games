/** Sunny Trail for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import { TILE } from '../shared/platform/physics';
import {
  ACTIONS,
  VIEW_H,
  VIEW_W,
  camera,
  isTrail,
  mapOf,
  newTrail,
  plannerPolicy,
  runnerPolicy,
  stepTrail,
  type PlatAction,
  type Trail,
} from './sim';

function drawTile(
  ctx: CanvasRenderingContext2D,
  c: string,
  x: number,
  y: number,
  above: string,
  t: number,
) {
  switch (c) {
    case '#':
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#a16a35';
      ctx.fillRect(x + 2, y + 6, 4, 3);
      ctx.fillRect(x + 9, y + 11, 4, 3);
      if (above !== '#') {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(x, y + 4, TILE, 1);
      }
      break;
    case 'B':
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x, y + 7, TILE, 1);
      ctx.fillRect(x, y + 15, TILE, 1);
      ctx.fillRect(x + 7, y, 1, 7);
      ctx.fillRect(x + 3, y + 8, 1, 7);
      ctx.fillRect(x + 12, y + 8, 1, 7);
      break;
    case '?':
    case '!': {
      ctx.fillStyle = Math.floor(t / 20) % 3 === 0 ? '#facc15' : '#eab308';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + 8, y + 12);
      ctx.textAlign = 'start';
      break;
    }
    case 'U':
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      break;
    case '=':
      ctx.fillStyle = '#d6a15c';
      ctx.fillRect(x, y, TILE, 4);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x + 2, y + 4, 2, 4);
      ctx.fillRect(x + 12, y + 4, 2, 4);
      break;
  }
}

function hero(
  ctx: CanvasRenderingContext2D,
  s: Trail,
  x: number,
  y: number,
  reducedMotion: boolean,
) {
  const h = s.hero;
  if (h.invuln > 0 && Math.floor(h.invuln / 4) % 2 === 0) return;
  const f = h.facing;
  const stride =
    !reducedMotion && h.ground && Math.abs(h.vx) > 0.2 ? Math.floor(s.steps / 6) % 2 : 0;
  // Boots, trousers, shirt, scarf, face and cap.
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x + 1 + stride, y + 12, 4, 2);
  ctx.fillRect(x + 6 - stride, y + 12, 4, 2);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 2, y + 9, 7, 3);
  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(x + 1, y + 5, 9, 4);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 1, y + 4, 9, 2);
  ctx.fillRect(f > 0 ? x - 2 : x + 10, y + 4 + (stride ? 1 : 0), 3, 2);
  ctx.fillStyle = '#f5d0a9';
  ctx.fillRect(x + 2, y, 7, 4);
  ctx.fillStyle = '#111';
  ctx.fillRect(f > 0 ? x + 7 : x + 3, y + 1, 1, 1);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(x + 1, y - 2, 9, 2);
  ctx.fillRect(f > 0 ? x + 8 : x - 1, y - 1, 4, 1);
  if (h.shield) {
    ctx.strokeStyle = 'rgba(244,114,182,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + 5.5, y + 6, 10, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export const DEF: ArcadeDef<Trail, PlatAction> = {
  id: 'platformer',
  prefix: 'pf',
  hz: 60,
  width: VIEW_W,
  height: VIEW_H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: () => newTrail(),
  step: (s, a) => stepTrail(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.coins', s.coins],
    ['hud.lives', s.lives],
    ['hud.level', s.level + 1],
    ['hud.time', Math.ceil(s.time / 60)],
  ],
  draw(ctx, s, { reducedMotion }) {
    const cam = Math.round(camera(s));
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Far hills and clouds, scrolling slower than the level.
    ctx.fillStyle = '#86efac';
    for (let k = -1; k < 6; k++) {
      const hx = k * 120 - ((cam * 0.3) % 120);
      ctx.beginPath();
      ctx.ellipse(hx + 60, VIEW_H - 32, 70, 46, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = -1; k < 5; k++) {
      const cx = k * 150 - ((cam * 0.15) % 150) + 40;
      ctx.beginPath();
      ctx.ellipse(cx, 36 + (k % 2) * 18, 22, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 16, 32 + (k % 2) * 18, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const map = mapOf(s);
    const tx0 = Math.floor(cam / TILE);
    for (let ty = 0; ty < map.rows.length; ty++)
      for (let tx = tx0; tx <= tx0 + VIEW_W / TILE + 1; tx++) {
        const c = map.rows[ty]?.[tx];
        if (!c || c === '.') continue;
        const x = tx * TILE - cam;
        const y = ty * TILE;
        if (c === 'o') {
          if (s.taken.includes(`${tx},${ty}`)) continue;
          const wobble = reducedMotion ? 4 : 2 + Math.abs(Math.sin(s.steps / 10)) * 3;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(x + 8, y + 8, wobble, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        if (c === 'F') {
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(x + 7, y, 2, TILE);
          if (ty === 2) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(x + 9, y);
            ctx.lineTo(x + 22, y + 5);
            ctx.lineTo(x + 9, y + 10);
            ctx.fill();
          }
          continue;
        }
        if (c === 'C') {
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(x + 7, y - 8, 2, 24);
          ctx.fillStyle = s.checkpoint ? '#22c55e' : '#94a3b8';
          ctx.fillRect(x + 9, y - 8, 9, 6);
          continue;
        }
        drawTile(ctx, c, x, y, map.rows[ty - 1]?.[tx] ?? '.', s.steps);
      }
    // Berries waiting on opened boxes.
    for (const b of s.berries) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(b.x - cam + 5, b.y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(b.x - cam + 4, b.y - 1, 4, 3);
    }
    // Beetles: purple domes (red and spiked for the spiky kind), flattened when squashed.
    for (const e of s.beetles) {
      const x = e.x - cam;
      if (x < -20 || x > VIEW_W + 20) continue;
      if (!e.alive) {
        ctx.fillStyle = '#7e22ce';
        ctx.fillRect(x, e.y + e.h - 4, e.w, 4);
        continue;
      }
      ctx.fillStyle = e.spiky ? '#dc2626' : '#9333ea';
      ctx.beginPath();
      ctx.ellipse(x + e.w / 2, e.y + 8, e.w / 2, 8, 0, Math.PI, 0);
      ctx.fill();
      if (e.spiky) {
        ctx.fillStyle = '#f8fafc';
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(x + 2 + k * 4, e.y + 2);
          ctx.lineTo(x + 4 + k * 4, e.y - 3);
          ctx.lineTo(x + 6 + k * 4, e.y + 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + (e.dir < 0 ? 2 : e.w - 5), e.y + 4, 3, 3);
      ctx.fillStyle = '#1f2937';
      const leg = reducedMotion ? 0 : Math.floor(s.steps / 8) % 2;
      ctx.fillRect(x + 1 + leg, e.y + 8, 3, 4);
      ctx.fillRect(x + e.w - 4 - leg, e.y + 8, 3, 4);
    }
    if (s.dying > 0) ctx.globalAlpha = Math.max(0.2, s.dying / 90);
    hero(ctx, s, Math.round(s.hero.x - cam), Math.round(s.hero.y), reducedMotion);
    ctx.globalAlpha = 1;
  },
  control(_s, held) {
    const h =
      held.has('left') && !held.has('right') ? -1 : held.has('right') && !held.has('left') ? 1 : 0;
    const j = held.has('fire') || held.has('up');
    if (j) return h < 0 ? 'left-jump' : h > 0 ? 'right-jump' : 'jump';
    return h < 0 ? 'left' : h > 0 ? 'right' : 'idle';
  },
  touch: ['left', 'right', 'fire'],
  pointer: false,
  policies: { planner: plannerPolicy, runner: runnerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    jump: [{ wave: 'square', freq: 330, freqEnd: 660, duration: 0.12, gain: 0.05 }],
    coin: [
      { wave: 'square', freq: 988, duration: 0.05, gain: 0.05 },
      { wave: 'square', freq: 1319, duration: 0.12, delay: 0.05, gain: 0.05 },
    ],
    stomp: [{ wave: 'triangle', freq: 220, freqEnd: 110, duration: 0.12, gain: 0.12 }],
    bump: [{ wave: 'square', freq: 140, duration: 0.06, gain: 0.06 }],
    'berry-out': [{ wave: 'triangle', freq: 523, freqEnd: 784, duration: 0.2, gain: 0.1 }],
    berry: [{ wave: 'triangle', freq: 784, freqEnd: 1568, duration: 0.25, gain: 0.12 }],
    'shield-lost': [{ wave: 'sawtooth', freq: 440, freqEnd: 220, duration: 0.25, gain: 0.08 }],
    checkpoint: [{ wave: 'triangle', freq: 660, duration: 0.15, gain: 0.1 }],
    die: [{ wave: 'sawtooth', freq: 500, freqEnd: 80, duration: 0.8, gain: 0.1 }],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
    flag: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.16 },
      { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.24, gain: 0.16 },
      { wave: 'triangle', freq: 1047, duration: 0.35, delay: 0.36, gain: 0.18 },
    ],
  },
  result: (s) => ({ outcome: s.won ? 'win' : 'complete', score: s.score, mode: 'platformer' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('stomp')) unlock('stomp');
    if (s.events.includes('berry')) unlock('berry');
    if (s.level >= 1) unlock('level');
    if (s.won) unlock('win');
  },
  ending: (s) =>
    s.won ? ['end.won', { n: s.score }] : ['end.over', { n: s.score, l: s.level + 1 }],
  validate: (d: unknown): d is Trail => isTrail(d),
  strings: {
    en: {
      title: 'Sunny Trail',
      'menu.subtitle':
        'Run and jump through three sunny levels: stomp beetles, open prize boxes, find the berry shield and reach the flag.',
      'hud.score': 'Score',
      'hud.coins': 'Coins',
      'hud.lives': 'Lives',
      'hud.level': 'Level',
      'hud.time': 'Time',
      'control.fire': 'Jump',
      'end.won': 'All three levels done — {n} points!',
      'end.over': 'Game over on level {l}: {n} points.',
    },
    es: {
      title: 'Sendero soleado',
      'menu.subtitle':
        'Corre y salta por tres niveles soleados: aplasta escarabajos, abre cajas sorpresa, consigue el escudo de baya y llega a la bandera.',
      'hud.score': 'Puntos',
      'hud.coins': 'Monedas',
      'hud.lives': 'Vidas',
      'hud.level': 'Nivel',
      'hud.time': 'Tiempo',
      'control.fire': 'Saltar',
      'end.won': '¡Los tres niveles superados: {n} puntos!',
      'end.over': 'Fin de la partida en el nivel {l}: {n} puntos.',
    },
  },
};
