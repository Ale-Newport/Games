/** Girder Climb for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  STAGES,
  W,
  climberPolicy,
  girderY,
  isGirders,
  newGirders,
  stageOf,
  stepGirders,
  topOf,
  walkerPolicy,
  type GirderAction,
  type Girders,
  type Stage,
} from './sim';

const BEAM = 7;

function drawGirders(ctx: CanvasRenderingContext2D, st: Stage) {
  for (const g of st.girders) {
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(g.x0, g.yl);
    ctx.lineTo(g.x1, g.yr);
    ctx.lineTo(g.x1, g.yr + BEAM);
    ctx.lineTo(g.x0, g.yl + BEAM);
    ctx.closePath();
    ctx.fill();
    // Cross-bracing and rivets.
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1;
    for (let x = g.x0; x + 8 <= g.x1; x += 8) {
      const y0 = g.yl + ((g.yr - g.yl) * (x - g.x0)) / (g.x1 - g.x0);
      ctx.beginPath();
      ctx.moveTo(x, y0 + 1);
      ctx.lineTo(x + 4, y0 + BEAM - 1);
      ctx.lineTo(x + 8, y0 + 1);
      ctx.stroke();
    }
  }
}

function drawLadders(ctx: CanvasRenderingContext2D, st: Stage) {
  for (const l of st.ladders) {
    const top = girderY(st, l.to, l.x) + BEAM;
    const bottom = girderY(st, l.from, l.x);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    const gapFrom = top + (bottom - top) * 0.35;
    const gapTo = top + (bottom - top) * 0.65;
    for (const dx of [-4, 4]) {
      ctx.beginPath();
      if (l.broken) {
        ctx.moveTo(l.x + dx, top);
        ctx.lineTo(l.x + dx, gapFrom);
        ctx.moveTo(l.x + dx, gapTo);
        ctx.lineTo(l.x + dx, bottom);
      } else {
        ctx.moveTo(l.x + dx, top);
        ctx.lineTo(l.x + dx, bottom);
      }
      ctx.stroke();
    }
    for (let y = top + 3; y < bottom; y += 4) {
      if (l.broken && y > gapFrom && y < gapTo) continue;
      ctx.beginPath();
      ctx.moveTo(l.x - 4, y);
      ctx.lineTo(l.x + 4, y);
      ctx.stroke();
    }
  }
}

function drawRobot(ctx: CanvasRenderingContext2D, s: Girders, st: Stage) {
  const { x } = st.robot;
  const y = girderY(st, st.robot.g, x);
  const throwing = s.throwIn < 20;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 12, y - 30, 24, 22);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 9, y - 42, 18, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x - 6, y - 38, 12, 4);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 42);
  ctx.lineTo(x, y - 48);
  ctx.stroke();
  ctx.fillStyle = s.steps % 30 < 15 ? '#fde047' : '#a16207';
  ctx.fillRect(x - 1.5, y - 51, 3, 3);
  // Arms: up when about to throw.
  ctx.fillStyle = '#475569';
  if (throwing) {
    ctx.fillRect(x - 17, y - 44, 5, 16);
    ctx.fillRect(x + 12, y - 44, 5, 16);
  } else {
    ctx.fillRect(x - 17, y - 28, 5, 14);
    ctx.fillRect(x + 12, y - 28, 5, 14);
  }
  ctx.fillRect(x - 10, y - 8, 7, 8);
  ctx.fillRect(x + 3, y - 8, 7, 8);
  // A stack of drums beside it, on the side away from its first throw.
  let side = -st.throws[0]!.dir;
  if (x + side * 20 < 6 || x + side * 20 > W - 6) side = -side;
  for (const dy of [-6, -16]) drum(ctx, x + side * 20, y + dy, 0);
}

function drum(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(spin) * 5, y + Math.sin(spin) * 5);
  ctx.lineTo(x - Math.cos(spin) * 5, y - Math.sin(spin) * 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawClimber(ctx: CanvasRenderingContext2D, s: Girders, reducedMotion: boolean) {
  const p = s.p;
  const x = p.x;
  const y = p.y;
  if (s.dying > 0) {
    ctx.globalAlpha = Math.max(0.2, s.dying / 90);
  }
  const step = reducedMotion ? 0 : Math.floor(s.steps / 8) % 2;
  // Legs.
  ctx.fillStyle = '#1e3a8a';
  if (p.mode === 'climb') {
    ctx.fillRect(x - 4, y - 7 - step * 2, 3, 7);
    ctx.fillRect(x + 1, y - 7 - (1 - step) * 2, 3, 7);
  } else {
    ctx.fillRect(x - 4 + (p.mode === 'walk' ? step : 0), y - 7, 3, 7);
    ctx.fillRect(x + 1 - (p.mode === 'walk' ? step : 0), y - 7, 3, 7);
  }
  // Overalls and shirt.
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(x - 4, y - 13, 8, 7);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(x - 5, y - 15, 10, 4);
  // Head and hard hat.
  ctx.fillStyle = '#f5d0a9';
  ctx.fillRect(x - 3, y - 19, 6, 5);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x - 4, y - 21, 8, 3);
  ctx.fillRect(x + (p.facing > 0 ? 2 : -6), y - 19, 4, 1.5);
  // The hammer, raised and lowered.
  if (p.hammer > 0) {
    const up = Math.floor(s.steps / 10) % 2 === 0;
    const hx = x + p.facing * (up ? 2 : 9);
    const hy = up ? y - 30 : y - 12;
    ctx.fillStyle = '#a16207';
    ctx.fillRect(hx - 1, hy, 2, 9);
    ctx.fillStyle = p.hammer < 120 && s.steps % 10 < 5 ? '#fde047' : '#9ca3af';
    ctx.fillRect(hx - 4, hy - 3, 8, 5);
  }
  ctx.globalAlpha = 1;
}

export const DEF: ArcadeDef<Girders, GirderAction> = {
  id: 'girder-climb',
  prefix: 'gc',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newGirders(seed),
  step: (s, a) => stepGirders(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.level', s.level],
    ['hud.stage', `${((s.level - 1) % STAGES.length) + 1}/${STAGES.length}`],
    ['hud.bonus', s.bonus],
  ],
  draw(ctx, s, { reducedMotion }) {
    const st = stageOf(s.level);
    ctx.fillStyle = '#050816';
    ctx.fillRect(0, 0, W, H);
    drawLadders(ctx, st);
    drawGirders(ctx, st);
    // The recycler on the floor, where drums end up.
    const bx = Math.max(10, Math.min(W - 10, st.binX));
    const by = girderY(st, 0, bx);
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx - 8, by - 16, 16, 16);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx - 6, by - 13, 12, 2);
    ctx.fillRect(bx - 6, by - 7, 12, 2);
    // The kitten on the top platform.
    const kx = st.kittenX;
    const ky = girderY(st, topOf(st), kx);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(kx - 6, ky - 8, 12, 7);
    ctx.fillRect(kx + 2, ky - 13, 7, 6);
    ctx.beginPath();
    ctx.moveTo(kx + 2, ky - 13);
    ctx.lineTo(kx + 4, ky - 17);
    ctx.lineTo(kx + 6, ky - 13);
    ctx.moveTo(kx + 5, ky - 13);
    ctx.lineTo(kx + 7.5, ky - 17);
    ctx.lineTo(kx + 9, ky - 13);
    ctx.fill();
    ctx.fillRect(kx - 10, ky - 12, 4, 2);
    if (s.rescued > 0) {
      ctx.fillStyle = '#f472b6';
      ctx.font = '10px sans-serif';
      ctx.fillText('♥', kx + 8, ky - 20);
    }
    drawRobot(ctx, s, st);
    // Hammers still hanging.
    st.hammers.forEach((h, i) => {
      if (!s.hammers[i]) return;
      const hy = girderY(st, h.g, h.x) - 22;
      ctx.fillStyle = '#a16207';
      ctx.fillRect(h.x - 1, hy, 2, 9);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(h.x - 4, hy - 3, 8, 5);
    });
    for (const d of s.drums) drum(ctx, d.x, d.y - 5, reducedMotion ? 0 : (d.x / 5) * d.dir);
    drawClimber(ctx, s, reducedMotion);
  },
  control(_s, held) {
    const h =
      held.has('left') && !held.has('right') ? -1 : held.has('right') && !held.has('left') ? 1 : 0;
    if (held.has('fire')) return h < 0 ? 'jump-left' : h > 0 ? 'jump-right' : 'jump';
    if (held.has('up')) return 'up';
    if (held.has('down')) return 'down';
    return h < 0 ? 'left' : h > 0 ? 'right' : 'idle';
  },
  touch: ['left', 'right', 'up', 'down', 'fire'],
  pointer: false,
  policies: { climber: climberPolicy, walker: walkerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    jump: [{ wave: 'square', freq: 300, freqEnd: 600, duration: 0.12, gain: 0.05 }],
    'over-drum': [{ wave: 'triangle', freq: 880, duration: 0.08, gain: 0.1 }],
    smash: [{ wave: 'square', freq: 200, freqEnd: 80, duration: 0.15, gain: 0.1 }],
    hammer: [{ wave: 'triangle', freq: 523, freqEnd: 1047, duration: 0.2, gain: 0.1 }],
    throw: [{ wave: 'sawtooth', freq: 120, duration: 0.1, gain: 0.04 }],
    drum: [{ wave: 'sawtooth', freq: 400, freqEnd: 60, duration: 0.7, gain: 0.1 }],
    fall: [{ wave: 'sine', freq: 700, freqEnd: 100, duration: 0.6, gain: 0.1 }],
    time: [{ wave: 'triangle', freq: 330, freqEnd: 110, duration: 0.5, gain: 0.1 }],
    rescue: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.16 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.24, gain: 0.18 },
    ],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'girder-climb' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('over-drum')) unlock('hop');
    if (s.events.includes('smash')) unlock('smash');
    if (s.events.includes('rescue')) unlock('rescue');
    if (s.score >= 20000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, l: s.level }],
  validate: (d: unknown): d is Girders => isGirders(d),
  strings: {
    en: {
      title: 'Girder Climb',
      'menu.subtitle':
        'A runaway robot is rolling drums down the girders. Jump them, grab a hammer, and climb up to rescue the kitten — on four different stages, then round again, faster.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.level': 'Level',
      'hud.stage': 'Stage',
      'hud.bonus': 'Bonus',
      'control.fire': 'Jump',
      'end.over': 'Game over on level {l}: {n} points.',
    },
    es: {
      title: 'Escalada de vigas',
      'menu.subtitle':
        'Un robot descontrolado hace rodar bidones por las vigas. Sáltalos, coge un martillo y sube a rescatar al gatito: en cuatro fases distintas, y luego otra vuelta, más rápida.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.level': 'Nivel',
      'hud.stage': 'Fase',
      'hud.bonus': 'Bonus',
      'control.fire': 'Saltar',
      'end.over': 'Fin de la partida en el nivel {l}: {n} puntos.',
    },
  },
};
