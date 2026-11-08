/** Balancing Cart for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  CALM,
  H,
  MAX_ANGLE,
  MAX_X,
  POLES,
  W,
  balancerPolicy,
  isCart,
  leanerPolicy,
  newCart,
  scoreOf,
  stepCart,
  type Cart,
  type CartAction,
  type PoleKind,
} from './sim';

const RAIL_Y = 196;
/** Pixels per metre along the rail. */
const PX = 62;

export const DEF: ArcadeDef<Cart, CartAction> = {
  id: 'cartpole',
  prefix: 'bc',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [{ id: 'pole', label: 'menu.pole', values: [...POLES], initial: POLES[0]! }],
  init: (seed, o) => newCart(seed, (o.pole ?? 'long') as PoleKind),
  step: (s, a) => stepCart(s, a),
  over: (s) => s.over,
  score: (s) => scoreOf(s),
  hud: (s) => [
    ['hud.time', (s.steps / 60).toFixed(1)],
    ['hud.lean', `${Math.round((s.a * 180) / Math.PI)}°`],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2 + s.x * PX;
    const hingeY = RAIL_Y - 22;
    const len = s.pole === 'long' ? 150 : 100;
    // The safe zone: a fan of ±24° above the hinge, reddening as the pole nears its edge.
    const danger = Math.abs(s.a) / MAX_ANGLE;
    ctx.fillStyle = `rgba(${Math.round(56 + 180 * danger)},${Math.round(189 - 120 * danger)},${Math.round(248 - 180 * danger)},0.12)`;
    ctx.beginPath();
    ctx.moveTo(cx, hingeY);
    ctx.arc(cx, hingeY, len + 12, -Math.PI / 2 - MAX_ANGLE, -Math.PI / 2 + MAX_ANGLE);
    ctx.closePath();
    ctx.fill();
    // Wind streaks while a gust blows.
    if (s.gust !== 0) {
      ctx.strokeStyle = 'rgba(226,232,240,0.5)';
      ctx.lineWidth = 1.5;
      const dir = Math.sign(s.gust);
      for (let k = 0; k < 7; k++) {
        const y = 30 + k * 18;
        const x = reducedMotion
          ? 60 + k * 30
          : (((s.steps * 6 + k * 97) % (W + 60)) - 30) * dir + (dir < 0 ? W : 0);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dir * 24, y);
        ctx.stroke();
      }
    }
    // The rail with its end stops and metre marks.
    ctx.fillStyle = '#475569';
    ctx.fillRect(W / 2 - MAX_X * PX - 10, RAIL_Y, MAX_X * PX * 2 + 20, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(W / 2 - MAX_X * PX - 12, RAIL_Y - 10, 4, 14);
    ctx.fillRect(W / 2 + MAX_X * PX + 8, RAIL_Y - 10, 4, 14);
    ctx.fillStyle = '#64748b';
    for (let m = -2; m <= 2; m++)
      ctx.fillRect(W / 2 + m * PX - 0.5, RAIL_Y + 6, 1, m === 0 ? 8 : 4);
    // The cart.
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(cx - 22, RAIL_Y - 20, 44, 16);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(cx - 22, RAIL_Y - 8, 44, 4);
    ctx.fillStyle = '#e2e8f0';
    for (const wx of [-13, 13]) {
      ctx.beginPath();
      ctx.arc(cx + wx, RAIL_Y - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // The pole and its weight.
    const tx = cx + Math.sin(s.a) * len;
    const ty = hingeY - Math.cos(s.a) * len;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, hingeY);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(tx, ty, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(cx, hingeY, 4, 0, Math.PI * 2);
    ctx.fill();
    // The calm start counting down to the first gust.
    if (s.steps < CALM && !s.over) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil((CALM - s.steps) / 60)}`, W / 2, 16);
      ctx.textAlign = 'start';
    }
  },
  control(_s, held, pointer) {
    // A finger on the left half pushes left, on the right half pushes right.
    if (pointer) return pointer.x < W / 2 ? 'left' : 'right';
    if (held.has('left') && !held.has('right')) return 'left';
    if (held.has('right') && !held.has('left')) return 'right';
    return 'idle';
  },
  touch: ['left', 'right'],
  pointer: true,
  policies: { balancer: balancerPolicy, leaner: leanerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    gust: [{ wave: 'sawtooth', freq: 180, freqEnd: 90, duration: 0.3, gain: 0.03 }],
    ten: [{ wave: 'triangle', freq: 880, duration: 0.12, gain: 0.08 }],
    fall: [{ wave: 'sawtooth', freq: 300, freqEnd: 60, duration: 0.6, gain: 0.12 }],
  },
  result: (s, o) => ({
    outcome: 'complete',
    score: scoreOf(s),
    timeMs: Math.round((s.steps / 60) * 1000),
    mode: `pole:${o.pole ?? 'long'}`,
  }),
  achievements: (s, _o, unlock) => {
    if (s.steps >= 600) unlock('ten');
    if (s.steps >= CALM + 600) unlock('weather');
    if (s.steps >= 3600) unlock('minute');
    if (s.steps >= 3600 && s.pole === 'short') unlock('short');
  },
  ending: (s) => [s.cause === 'rail' ? 'end.rail' : 'end.fell', { t: (s.steps / 60).toFixed(1) }],
  validate: (d: unknown): d is Cart => isCart(d),
  strings: {
    en: {
      title: 'Balancing Cart',
      'menu.subtitle':
        'Push the cart left and right to keep the pole standing. Gusts start after 20 seconds.',
      'menu.pole': 'Pole',
      'pole.long': 'Long',
      'pole.short': 'Short',
      'pole.long.hint': 'Falls slowly: the place to start.',
      'pole.short.hint': 'Falls faster and needs quicker hands.',
      'hud.time': 'Time',
      'hud.lean': 'Lean',
      'control.left': 'Push left',
      'control.right': 'Push right',
      'end.fell': 'The pole fell after {t} s.',
      'end.rail': 'The cart ran off the rail after {t} s.',
    },
    es: {
      title: 'Carro equilibrista',
      'menu.subtitle':
        'Empuja el carro a izquierda y derecha para mantener el palo de pie. Las ráfagas empiezan a los 20 segundos.',
      'menu.pole': 'Palo',
      'pole.long': 'Largo',
      'pole.short': 'Corto',
      'pole.long.hint': 'Cae despacio: para empezar.',
      'pole.short.hint': 'Cae más rápido y pide reflejos.',
      'hud.time': 'Tiempo',
      'hud.lean': 'Inclinación',
      'control.left': 'Empujar a la izquierda',
      'control.right': 'Empujar a la derecha',
      'end.fell': 'El palo se ha caído a los {t} s.',
      'end.rail': 'El carro se ha salido del raíl a los {t} s.',
    },
  },
};
