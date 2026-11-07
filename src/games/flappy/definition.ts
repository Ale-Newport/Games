/** Puffin Flap for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  BIRD_X,
  H,
  SEA,
  W,
  isFlight,
  newFlight,
  plannerPolicy,
  stepFlight,
  trackerPolicy,
  type FlapAction,
  type Flight,
} from './sim';

const STACK_W = 40;

function rock(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  cap: 'top' | 'bottom',
) {
  ctx.fillStyle = '#57534e';
  ctx.fillRect(x, top, STACK_W, bottom - top);
  ctx.fillStyle = '#78716c';
  ctx.fillRect(x + 4, top, 8, bottom - top);
  ctx.fillStyle = '#44403c';
  for (let y = top + 10; y < bottom - 4; y += 22) ctx.fillRect(x + 18, y, 16, 3);
  // A mossy lip at the gap.
  ctx.fillStyle = '#65a30d';
  if (cap === 'top') ctx.fillRect(x - 3, bottom - 8, STACK_W + 6, 8);
  else ctx.fillRect(x - 3, top, STACK_W + 6, 8);
}

function puffin(ctx: CanvasRenderingContext2D, s: Flight, reducedMotion: boolean) {
  const tilt = Math.max(-0.5, Math.min(1.1, s.vy / 7));
  ctx.save();
  ctx.translate(BIRD_X, s.y);
  ctx.rotate(tilt);
  // Body and belly.
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(1, 3, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Face, eye, and the striped orange beak.
  ctx.beginPath();
  ctx.ellipse(5, -3, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.fillRect(6, -5, 2, 2);
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(9, -5);
  ctx.lineTo(16, -1);
  ctx.lineTo(9, 2);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(10, -4, 1.5, 5);
  // The wing: up on a fresh flap, down otherwise.
  const up = !reducedMotion && s.vy < -1.5;
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.moveTo(-4, -1);
  ctx.lineTo(-12, up ? -10 : 6);
  ctx.lineTo(2, 1);
  ctx.fill();
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(-6, 8, 3, 3);
  ctx.fillRect(-1, 8, 3, 3);
  ctx.restore();
}

export const DEF: ArcadeDef<Flight, FlapAction> = {
  id: 'flappy',
  prefix: 'fp',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newFlight(seed),
  step: (s, a) => stepFlight(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [['hud.score', s.score]],
  draw(ctx, s, { reducedMotion }) {
    const sky = ctx.createLinearGradient(0, 0, 0, SEA);
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(1, '#fde68a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, SEA);
    // A far headland drifting slowly.
    const far = reducedMotion ? 0 : (s.steps * 0.3) % (W + 120);
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.moveTo(W - far, SEA);
    ctx.lineTo(W + 30 - far, SEA - 60);
    ctx.lineTo(W + 90 - far, SEA - 40);
    ctx.lineTo(W + 120 - far, SEA);
    ctx.fill();
    for (const st of s.stacks) {
      rock(ctx, st.x, 0, st.gap, 'top');
      rock(ctx, st.x, st.gap + st.size, SEA, 'bottom');
    }
    // The sea, with rolling crests.
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, SEA, W, H - SEA);
    ctx.fillStyle = '#7dd3fc';
    const off = reducedMotion ? 0 : (s.steps * 1.6) % 24;
    for (let x = -24; x < W + 24; x += 24) {
      ctx.beginPath();
      ctx.arc(x - off + 12, SEA + 4, 8, Math.PI, 0);
      ctx.fill();
    }
    puffin(ctx, s, reducedMotion);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(String(s.score), W / 2, 44);
    ctx.fillText(String(s.score), W / 2, 44);
    ctx.textAlign = 'start';
  },
  control: (_s, held, pointer) => (held.has('fire') || held.has('up') || pointer ? 'flap' : 'idle'),
  touch: ['fire'],
  pointer: true,
  policies: { planner: plannerPolicy, tracker: trackerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    flap: [{ wave: 'triangle', freq: 500, freqEnd: 700, duration: 0.06, gain: 0.05 }],
    point: [{ wave: 'square', freq: 988, duration: 0.08, gain: 0.05 }],
    crash: [{ wave: 'sawtooth', freq: 300, freqEnd: 60, duration: 0.5, gain: 0.1 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'flappy' }),
  achievements: (s, _o, unlock) => {
    if (s.score >= 10) unlock('ten');
    if (s.score >= 25) unlock('twentyfive');
    if (s.score >= 50) unlock('fifty');
    if (s.score >= 100) unlock('hundred');
  },
  ending: (s) => ['end.crash', { n: s.score }],
  validate: (d: unknown): d is Flight => isFlight(d),
  strings: {
    en: {
      title: 'Puffin Flap',
      'menu.subtitle': 'Tap to flap and steer the puffin through the gaps between the sea stacks.',
      'hud.score': 'Score',
      'control.fire': 'Flap',
      'end.crash': 'Splash! {n} stacks passed.',
    },
    es: {
      title: 'Aleteo de frailecillo',
      'menu.subtitle':
        'Toca para aletear y guía al frailecillo por los huecos entre los farallones.',
      'hud.score': 'Puntos',
      'control.fire': 'Aletear',
      'end.crash': '¡Chof! {n} farallones superados.',
    },
  },
};
