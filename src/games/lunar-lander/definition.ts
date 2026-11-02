/** Moon Touchdown for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  SAFE_ANGLE,
  SAFE_VX,
  SAFE_VY,
  W,
  brakerPolicy,
  isLander,
  newLander,
  pilotPolicy,
  stepLander,
  type Lander,
  type LanderAction,
} from './sim';

/** Fixed star positions (a simple hash, so they never move). */
const STARS = Array.from(
  { length: 60 },
  (_, i) => [(i * 97) % W, (i * 53 + (i % 7) * 11) % 150, i % 3] as const,
);

function lander(ctx: CanvasRenderingContext2D, s: Lander, x: number, reducedMotion: boolean) {
  ctx.save();
  ctx.translate(x, s.y);
  ctx.rotate(s.angle);
  if (s.firing) {
    const len = reducedMotion ? 10 : 8 + (s.steps % 4) * 2;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-3, 5);
    ctx.lineTo(0, 5 + len);
    ctx.lineTo(3, 5);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.moveTo(-1.5, 5);
    ctx.lineTo(0, 5 + len * 0.6);
    ctx.lineTo(1.5, 5);
    ctx.fill();
  }
  // Legs and feet.
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.lineTo(-7, 7);
  ctx.moveTo(4, 2);
  ctx.lineTo(7, 7);
  ctx.stroke();
  ctx.fillRect(-9, 6.5, 4, 1);
  ctx.fillRect(5, 6.5, 4, 1);
  // Gold-foil body and a dark window.
  ctx.fillStyle = '#d4a017';
  ctx.beginPath();
  ctx.moveTo(-6, 3);
  ctx.lineTo(-6, -3);
  ctx.lineTo(-3, -7);
  ctx.lineTo(3, -7);
  ctx.lineTo(6, -3);
  ctx.lineTo(6, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-2.5, -5, 5, 3);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-3, 3, 6, 2);
  ctx.restore();
}

export const DEF: ArcadeDef<Lander, LanderAction> = {
  id: 'lunar-lander',
  prefix: 'll',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newLander(seed),
  step: (s, a) => stepLander(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.fuel', s.fuel],
    ['hud.round', s.round],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, W, H);
    for (const [x, y, k] of STARS) {
      ctx.fillStyle = k === 0 ? '#f8fafc' : k === 1 ? '#94a3b8' : '#475569';
      ctx.fillRect(x, y, 1, 1);
    }
    // A crescent of the home planet.
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(270, 40, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#030712';
    ctx.beginPath();
    ctx.arc(276, 36, 13, 0, Math.PI * 2);
    ctx.fill();
    // Ground.
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.moveTo(0, H);
    s.ground.forEach((g, i) => ctx.lineTo(i * 8, g));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    s.ground.forEach((g, i) => (i ? ctx.lineTo(i * 8, g) : ctx.moveTo(0, g)));
    ctx.stroke();
    for (const p of s.pads) {
      const blink = !reducedMotion && s.pause === 0 && Math.floor(s.steps / 20) % 2 === 0;
      ctx.fillStyle = p.mult === 5 ? '#f43f5e' : p.mult === 3 ? '#facc15' : '#22c55e';
      ctx.fillRect(p.x0, p.y - 1, p.x1 - p.x0, 3);
      if (blink) {
        ctx.fillRect(p.x0, p.y - 4, 2, 3);
        ctx.fillRect(p.x1 - 2, p.y - 4, 2, 3);
      }
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`×${p.mult}`, (p.x0 + p.x1) / 2, p.y + 12);
      ctx.textAlign = 'start';
    }
    // The lander, drawn twice near the edges so the wrap looks seamless.
    if (s.outcome === 'crashed') {
      const p = s.pause / 120;
      ctx.fillStyle = '#f97316';
      for (let k = 0; k < 10; k++) {
        const a = (Math.PI * 2 * k) / 10;
        const r = (1 - p) * 22;
        ctx.fillRect(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 0.6, 2, 2);
      }
    } else
      for (const off of [-W, 0, W])
        if (s.x + off > -20 && s.x + off < W + 20) lander(ctx, s, s.x + off, reducedMotion);
    // Instruments: speeds and tilt, green when safe for a touchdown.
    const safe = (ok: boolean) => (ok ? '#4ade80' : '#f87171');
    ctx.font = '9px monospace';
    ctx.fillStyle = safe(s.vy <= SAFE_VY);
    ctx.fillText(`↓ ${s.vy.toFixed(2)}`, 6, 12);
    ctx.fillStyle = safe(Math.abs(s.vx) <= SAFE_VX);
    ctx.fillText(`↔ ${s.vx.toFixed(2)}`, 6, 23);
    ctx.fillStyle = safe(Math.abs(s.angle) <= SAFE_ANGLE);
    ctx.fillText(`∠ ${Math.round((s.angle * 180) / Math.PI)}°`, 6, 34);
  },
  control(_s, held) {
    const t = held.has('up') || held.has('fire');
    const turn =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    if (t) return (turn ? `thrust-${turn}` : 'thrust') as LanderAction;
    return (turn || 'idle') as LanderAction;
  },
  touch: ['left', 'fire', 'right'],
  pointer: false,
  policies: { pilot: pilotPolicy, braker: brakerPolicy },
  sounds: (_p, next) => [
    ...next.events,
    ...(next.firing && next.steps % 6 === 0 ? ['engine'] : []),
  ],
  soundBank: {
    engine: [{ wave: 'sawtooth', freq: 70, duration: 0.1, gain: 0.03 }],
    landed: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.25, delay: 0.12, gain: 0.14 },
    ],
    crashed: [{ wave: 'sawtooth', freq: 200, freqEnd: 40, duration: 0.8, gain: 0.12 }],
    empty: [{ wave: 'square', freq: 220, duration: 0.3, gain: 0.08 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'lunar-lander' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('landed')) unlock('touchdown');
    if (s.events.includes('landed') && s.lastPoints >= 250) unlock('five');
    if (s.landings >= 5 && s.crashes === 0) unlock('clean');
    if (s.score >= 2000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, l: s.landings }],
  validate: (d: unknown): d is Lander => isLander(d),
  strings: {
    en: {
      title: 'Moon Touchdown',
      'menu.subtitle':
        'Turn, burn and set the lander down gently on a pad. Narrow pads pay more; crashes cost fuel.',
      'hud.score': 'Score',
      'hud.fuel': 'Fuel',
      'hud.round': 'Round',
      'control.fire': 'Engine',
      'control.left': 'Turn left',
      'control.right': 'Turn right',
      'end.over': 'Out of fuel after {l} touchdowns: {n} points.',
    },
    es: {
      title: 'Alunizaje',
      'menu.subtitle':
        'Gira, enciende el motor y posa el módulo con suavidad en una plataforma. Las estrechas pagan más; los choques cuestan combustible.',
      'hud.score': 'Puntos',
      'hud.fuel': 'Combustible',
      'hud.round': 'Ronda',
      'control.fire': 'Motor',
      'control.left': 'Girar a la izquierda',
      'control.right': 'Girar a la derecha',
      'end.over': 'Sin combustible tras {l} alunizajes: {n} puntos.',
    },
  },
};
