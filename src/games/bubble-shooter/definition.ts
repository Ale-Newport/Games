/** Bubble Cannon for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  AIMS,
  CANNON_X,
  CANNON_Y,
  DEADLINE,
  H,
  R,
  W,
  advance,
  aimerPolicy,
  angleOf,
  cellX,
  cellY,
  isBubbles,
  launch,
  newBubbles,
  sprayerPolicy,
  stepBubbles,
  type BubbleAction,
  type Bubbles,
} from './sim';

const COLOURS = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#f97316'];

/** A bubble with a small mark for its colour, so colours can be told apart without hue. */
function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, colour: number) {
  ctx.fillStyle = COLOURS[colour] ?? '#94a3b8';
  ctx.beginPath();
  ctx.arc(x, y, R - 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.6)';
  ctx.fillStyle = 'rgba(15,23,42,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  switch (colour) {
    case 0:
      ctx.arc(x + 1, y + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 1:
      ctx.arc(x + 1, y + 1, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 2:
      ctx.moveTo(x - 2, y - 2);
      ctx.lineTo(x + 4, y + 4);
      ctx.moveTo(x + 4, y - 2);
      ctx.lineTo(x - 2, y + 4);
      ctx.stroke();
      break;
    case 3:
      ctx.moveTo(x + 1, y - 3);
      ctx.lineTo(x + 5, y + 4);
      ctx.lineTo(x - 3, y + 4);
      ctx.closePath();
      ctx.stroke();
      break;
    case 4:
      ctx.rect(x - 2, y - 2, 6, 6);
      ctx.stroke();
      break;
    default:
      ctx.moveTo(x - 3, y + 1);
      ctx.lineTo(x + 5, y + 1);
      ctx.moveTo(x + 1, y - 3);
      ctx.lineTo(x + 1, y + 5);
      ctx.stroke();
  }
}

export const DEF: ArcadeDef<Bubbles, BubbleAction> = {
  id: 'bubble-shooter',
  prefix: 'bq',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newBubbles(seed),
  step: (s, a) => stepBubbles(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.level', s.level],
    ['hud.row', s.untilRow],
  ],
  draw(ctx, s) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c4a6e');
    bg.addColorStop(1, '#082f49');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(248,113,113,0.6)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, DEADLINE + R);
    ctx.lineTo(W, DEADLINE + R);
    ctx.stroke();
    ctx.setLineDash([]);
    s.grid.forEach((row, r) =>
      row.forEach((v, c) => v >= 0 && bubble(ctx, cellX(s, r, c), cellY(r), v)),
    );
    // The aiming guide: dots along the path, bank shots included, for the first stretch.
    if (!s.flying && !s.pause && !s.over) {
      let f = launch(Math.round(s.aim), s.current);
      ctx.fillStyle = 'rgba(226,232,240,0.6)';
      for (let k = 0; k < 22; k++) {
        const res = advance(s, f);
        if (res.stuck) break;
        f = res.f;
        if (k % 2 === 1) ctx.fillRect(f.x - 1, f.y - 1, 2, 2);
      }
    }
    // The cannon, pointing along the aim.
    const a = angleOf(Math.round(s.aim));
    ctx.save();
    ctx.translate(CANNON_X, CANNON_Y);
    ctx.rotate(a);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-5, -26, 10, 22);
    ctx.restore();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(CANNON_X, CANNON_Y + 4, 16, Math.PI, 0);
    ctx.fill();
    if (!s.flying && !s.pause) bubble(ctx, CANNON_X, CANNON_Y, s.current);
    if (s.flying) bubble(ctx, s.flying.x, s.flying.y, s.flying.colour);
    // The next bubble, to the left.
    ctx.fillStyle = 'rgba(226,232,240,0.7)';
    ctx.font = '8px sans-serif';
    ctx.fillText('↻', CANNON_X - 58, CANNON_Y + 4);
    bubble(ctx, CANNON_X - 40, CANNON_Y + 4, s.next);
    // Shots until a new row: little pips on the right.
    for (let k = 0; k < s.untilRow; k++) {
      ctx.fillStyle = s.untilRow <= 2 ? '#f87171' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(CANNON_X + 32 + k * 7, CANNON_Y + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.pause) {
      ctx.fillStyle = 'rgba(15,23,42,0.6)';
      ctx.fillRect(0, H / 2 - 20, W, 40);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${1000 * s.level}`, W / 2, H / 2 + 5);
      ctx.textAlign = 'start';
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      // Aim at the finger; the shot goes when it lifts.
      const a = Math.atan2(pointer.x - CANNON_X, CANNON_Y - Math.min(pointer.y, CANNON_Y - 10));
      const k = Math.round(((a - angleOf(0)) / (angleOf(AIMS - 1) - angleOf(0))) * (AIMS - 1));
      return `aim-${Math.max(0, Math.min(AIMS - 1, k))}`;
    }
    if (s.touchAim) return 'fire';
    if (held.has('fire')) return 'fire';
    if (held.has('alt')) return 'swap';
    if (held.has('left') && !held.has('right')) return 'left';
    if (held.has('right') && !held.has('left')) return 'right';
    return 'idle';
  },
  touch: ['left', 'right', 'alt', 'fire'],
  pointer: true,
  policies: { aimer: aimerPolicy, sprayer: sprayerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    fire: [{ wave: 'square', freq: 500, freqEnd: 800, duration: 0.06, gain: 0.05 }],
    stick: [{ wave: 'triangle', freq: 220, duration: 0.05, gain: 0.05 }],
    pop: [{ wave: 'triangle', freq: 880, freqEnd: 1320, duration: 0.12, gain: 0.08 }],
    drop: [
      { wave: 'triangle', freq: 880, freqEnd: 1320, duration: 0.12, gain: 0.08 },
      { wave: 'triangle', freq: 660, freqEnd: 330, duration: 0.3, delay: 0.1, gain: 0.08 },
    ],
    swap: [{ wave: 'square', freq: 400, duration: 0.04, gain: 0.04 }],
    row: [{ wave: 'sawtooth', freq: 140, freqEnd: 90, duration: 0.3, gain: 0.08 }],
    clear: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.12 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.12 },
      { wave: 'triangle', freq: 1047, duration: 0.3, delay: 0.24, gain: 0.14 },
    ],
    over: [{ wave: 'sawtooth', freq: 300, freqEnd: 60, duration: 0.8, gain: 0.1 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'bubble-shooter' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('pop') || s.events.includes('drop')) unlock('pop');
    if (s.events.includes('drop')) unlock('drop');
    if (s.events.includes('clear')) unlock('clear');
    if (s.level >= 5) unlock('level5');
  },
  ending: (s) => ['end.over', { n: s.score, l: s.level }],
  validate: (d: unknown): d is Bubbles => isBubbles(d),
  strings: {
    en: {
      title: 'Bubble Cannon',
      'menu.subtitle':
        'Fire bubbles into the honeycomb: three of a colour pop, and whatever hangs from nothing drops.',
      'hud.score': 'Score',
      'hud.level': 'Level',
      'hud.row': 'New row in',
      'control.left': 'Aim left',
      'control.right': 'Aim right',
      'control.fire': 'Fire',
      'control.alt': 'Swap',
      'end.over': 'The bubbles reached the line on level {l}: {n} points.',
    },
    es: {
      title: 'Cañón de burbujas',
      'menu.subtitle':
        'Dispara burbujas al panal: tres del mismo color explotan y lo que queda colgando de nada cae.',
      'hud.score': 'Puntos',
      'hud.level': 'Nivel',
      'hud.row': 'Nueva fila en',
      'control.left': 'Apuntar a la izquierda',
      'control.right': 'Apuntar a la derecha',
      'control.fire': 'Disparar',
      'control.alt': 'Cambiar',
      'end.over': 'Las burbujas han llegado a la línea en el nivel {l}: {n} puntos.',
    },
  },
};
