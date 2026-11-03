/** Sky Lances for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  LAVA,
  LEDGES,
  W,
  glidePolicy,
  isLances,
  lancerPolicy,
  newLances,
  stepLances,
  type LanceAction,
  type Lances,
  type Rider,
} from './sim';

const MOUNT = {
  player: '#14b8a6',
  bounder: '#dc2626',
  hunter: '#94a3b8',
  shadow: '#1e3a8a',
} as const;
const KNIGHT = {
  player: '#facc15',
  bounder: '#fca5a5',
  hunter: '#e2e8f0',
  shadow: '#93c5fd',
} as const;

function rider(ctx: CanvasRenderingContext2D, r: Rider, steps: number, reducedMotion: boolean) {
  for (const off of [0, -W, W]) {
    const x = r.x + off;
    if (x < -20 || x > W + 20) continue;
    const y = r.y;
    const f = r.facing;
    const wingUp = !reducedMotion && !r.ground && r.vy < 0;
    // The winged drake.
    ctx.fillStyle = MOUNT[r.rank];
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + f * 5, y + 3, 3 * f, 6);
    ctx.fillRect(x + f * 7, y + 2, 4 * f, 3);
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 7);
    ctx.lineTo(x - 8 * f, wingUp ? y - 2 : y + 14);
    ctx.lineTo(x + 3, y + 8);
    ctx.fill();
    if (r.ground) {
      ctx.fillRect(x - 3, y + 12, 2, 2);
      ctx.fillRect(x + 2 + ((steps >> 3) & 1), y + 12, 2, 2);
    }
    // The knight and the lance.
    ctx.fillStyle = KNIGHT[r.rank];
    ctx.fillRect(x - 2, y, 4, 6);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(f > 0 ? x + 1 : x - 11, y + 3, 10, 1.5);
  }
}

export const DEF: ArcadeDef<Lances, LanceAction> = {
  id: 'joust',
  prefix: 'sl',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newLances(seed),
  step: (s, a) => stepLances(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.wave', s.wave],
  ],
  draw(ctx, s, { reducedMotion }) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(1, '#7c2d12');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (const l of LEDGES) {
      ctx.fillStyle = '#57534e';
      ctx.fillRect(l.x0, l.y, l.x1 - l.x0, 6);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(l.x0, l.y, l.x1 - l.x0, 2);
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.moveTo(l.x0 + 6, l.y + 6);
      ctx.lineTo((l.x0 + l.x1) / 2, l.y + 14);
      ctx.lineTo(l.x1 - 6, l.y + 6);
      ctx.fill();
    }
    // Lava, bubbling.
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, LAVA, W, H - LAVA);
    ctx.fillStyle = '#facc15';
    for (let k = 0; k < 8; k++) {
      const x = (k * 43 + (reducedMotion ? 0 : s.steps * 0.3)) % W;
      const bob = reducedMotion ? 0 : Math.sin(s.steps / 9 + k) * 2;
      ctx.beginPath();
      ctx.arc(x, LAVA + 3 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of s.eggs) {
      ctx.fillStyle = e.hatch < 120 && Math.floor(e.hatch / 8) % 2 ? '#fde68a' : '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 3, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(e.x - 1, e.y + 1, 1.5, 1.5);
      ctx.fillRect(e.x + 1, e.y + 4, 1.5, 1.5);
    }
    for (const r of s.rivals) rider(ctx, r, s.steps, reducedMotion);
    if (s.dying > 0) ctx.globalAlpha = Math.max(0.2, s.dying / 90);
    rider(ctx, s.player, s.steps, reducedMotion);
    ctx.globalAlpha = 1;
    if (s.between > 0) {
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+3000', W / 2, 50);
      ctx.textAlign = 'start';
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      // A touch flaps; which side of the rider it is on steers.
      const d = pointer.x - s.player.x;
      return (Math.abs(d) < 12 ? 'flap' : d > 0 ? 'flap-right' : 'flap-left') as LanceAction;
    }
    const flap = held.has('fire') || held.has('up');
    const h =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    if (flap) return (h ? `flap-${h}` : 'flap') as LanceAction;
    return (h || 'idle') as LanceAction;
  },
  touch: ['left', 'fire', 'right'],
  pointer: true,
  policies: { lancer: lancerPolicy, glider: glidePolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    flap: [{ wave: 'triangle', freq: 300, freqEnd: 200, duration: 0.05, gain: 0.04 }],
    unhorse: [
      { wave: 'square', freq: 660, duration: 0.06, gain: 0.08 },
      { wave: 'square', freq: 990, duration: 0.1, delay: 0.06, gain: 0.08 },
    ],
    unhorsed: [{ wave: 'sawtooth', freq: 400, freqEnd: 70, duration: 0.7, gain: 0.1 }],
    lava: [{ wave: 'sawtooth', freq: 200, freqEnd: 40, duration: 0.8, gain: 0.12 }],
    clash: [{ wave: 'square', freq: 1500, duration: 0.05, gain: 0.06 }],
    egg: [{ wave: 'triangle', freq: 880, freqEnd: 1320, duration: 0.12, gain: 0.08 }],
    hatch: [{ wave: 'square', freq: 200, freqEnd: 500, duration: 0.25, gain: 0.06 }],
    arrive: [{ wave: 'triangle', freq: 220, freqEnd: 440, duration: 0.15, gain: 0.05 }],
    cleared: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.12, gain: 0.16 },
    ],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'joust' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('unhorse')) unlock('joust');
    if (s.events.includes('egg')) unlock('egg');
    if (s.events.includes('cleared')) unlock('wave');
    if (s.score >= 30000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, w: s.wave }],
  validate: (d: unknown): d is Lances => isLances(d),
  strings: {
    en: {
      title: 'Sky Lances',
      'menu.subtitle':
        'Flap your drake into the air and meet the rival riders from above — the higher lance wins.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.wave': 'Wave',
      'control.fire': 'Flap',
      'end.over': 'Unhorsed for good on wave {w}: {n} points.',
    },
    es: {
      title: 'Lanzas del cielo',
      'menu.subtitle':
        'Haz volar a tu dragón y enfréntate a los jinetes rivales desde arriba: gana la lanza más alta.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.wave': 'Oleada',
      'control.fire': 'Aletear',
      'end.over': 'Derribado del todo en la oleada {w}: {n} puntos.',
    },
  },
};
