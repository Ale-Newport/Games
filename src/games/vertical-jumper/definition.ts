/** Cloud Climber for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  CLOUD_W,
  H,
  W,
  drifterPolicy,
  isClimb,
  metres,
  newClimb,
  plannerPolicy,
  scoreOf,
  stepClimb,
  type Climb,
  type ClimbAction,
  type Cloud,
} from './sim';

function puff(ctx: CanvasRenderingContext2D, x: number, y: number, c: Cloud) {
  ctx.fillStyle =
    c.kind === 'drift' ? '#ddd6fe' : c.kind === 'thin' ? 'rgba(255,255,255,0.45)' : '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(x + CLOUD_W / 2, y + 4, CLOUD_W / 2, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 13, y + 1, 9, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 26, y, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (c.kind === 'thin') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + CLOUD_W / 2, y + 4, CLOUD_W / 2, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (c.kind === 'spring') {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= 4; k++) ctx.lineTo(x + CLOUD_W / 2 + (k % 2 ? 4 : -4), y - 2 - k * 2);
    ctx.stroke();
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x + CLOUD_W / 2 - 6, y - 12, 12, 3);
  }
}

/** Draws something at x and, near a side, again on the other side (the screen wraps). */
function wrapped(x: number, w: number, draw: (x: number) => void) {
  draw(x);
  if (x < w) draw(x + W);
  if (x > W - w) draw(x - W);
}

export const DEF: ArcadeDef<Climb, ClimbAction> = {
  id: 'vertical-jumper',
  prefix: 'cc',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newClimb(seed),
  step: (s, a) => stepClimb(s, a),
  over: (s) => s.over,
  score: (s) => scoreOf(s),
  hud: (s) => [
    ['hud.height', `${metres(s.top)} m`],
    ['hud.pops', s.pops],
  ],
  draw(ctx, s, { reducedMotion }) {
    // The sky darkens towards space the higher she climbs.
    const t = Math.min(1, metres(s.top) / 3000);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(
      0,
      `rgb(${Math.round(56 - 40 * t)},${Math.round(189 - 150 * t)},${Math.round(248 - 120 * t)})`,
    );
    sky.addColorStop(
      1,
      `rgb(${Math.round(186 - 120 * t)},${Math.round(230 - 150 * t)},${Math.round(253 - 100 * t)})`,
    );
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    if (t > 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${(t - 0.3) * 0.9})`;
      for (let k = 0; k < 30; k++)
        ctx.fillRect((k * 67) % W, (k * 89 + (reducedMotion ? 0 : -s.cam * 0.05)) % H, 1, 1);
    }
    const sy = (wy: number) => wy - s.cam;
    // Faint height marks every 100 m.
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '8px sans-serif';
    for (let m = Math.ceil(-(s.cam + H) / 1000) * 1000; m <= -s.cam; m += 1000)
      if (m > 0) {
        ctx.fillRect(0, sy(-m), 8, 1);
        ctx.fillText(`${m / 10} m`, 10, sy(-m) + 3);
      }
    for (const c of s.clouds)
      if (!c.gone && sy(c.y) > -20 && sy(c.y) < H + 20)
        wrapped(c.x, CLOUD_W, (x) => puff(ctx, x, sy(c.y), c));
    for (const sp of s.sprites)
      if (!sp.gone && sy(sp.y) > -20 && sy(sp.y) < H + 20)
        wrapped(sp.x, 12, (x) => {
          const y = sy(sp.y);
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.ellipse(x, y, 11, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(x - 2, y + 6);
          ctx.lineTo(x + 3, y + 10);
          ctx.lineTo(x, y + 11);
          ctx.lineTo(x + 3, y + 16);
          ctx.lineTo(x - 3, y + 10);
          ctx.lineTo(x, y + 9);
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x - 5, y - 2, 3, 3);
          ctx.fillRect(x + 2, y - 2, 3, 3);
        });
    // The climber: green hood, round face, little boots; she leans the way she moves.
    if (!s.over) {
      const m = s.me;
      wrapped(m.x, 10, (x) => {
        const y = sy(m.y);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s.dying ? Math.PI : Math.max(-0.3, Math.min(0.3, m.vx / 12)));
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(-6, -18, 12, 12);
        ctx.beginPath();
        ctx.arc(0, -19, 6, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(0, -15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(m.vx >= 0 ? 0.5 : -2.5, -16, 1.5, 1.5);
        ctx.fillStyle = '#7c2d12';
        const kick = m.vy < 0 ? 2 : 0;
        ctx.fillRect(-5, -6 + kick, 4, 6 - kick);
        ctx.fillRect(1, -6 + kick, 4, 6 - kick);
        ctx.restore();
      });
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      // Steer towards the finger the short way round.
      let dx = pointer.x - s.me.x;
      if (dx > W / 2) dx -= W;
      if (dx < -W / 2) dx += W;
      return Math.abs(dx) < 6 ? 'idle' : dx > 0 ? 'right' : 'left';
    }
    if (held.has('left') && !held.has('right')) return 'left';
    if (held.has('right') && !held.has('left')) return 'right';
    return 'idle';
  },
  touch: ['left', 'right'],
  pointer: true,
  policies: { planner: plannerPolicy, drifter: drifterPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    bounce: [{ wave: 'triangle', freq: 440, freqEnd: 880, duration: 0.08, gain: 0.05 }],
    spring: [{ wave: 'square', freq: 300, freqEnd: 1200, duration: 0.3, gain: 0.08 }],
    burst: [{ wave: 'sawtooth', freq: 500, freqEnd: 200, duration: 0.1, gain: 0.04 }],
    pop: [{ wave: 'square', freq: 1000, freqEnd: 300, duration: 0.15, gain: 0.08 }],
    milestone: [
      { wave: 'triangle', freq: 784, duration: 0.1, gain: 0.08 },
      { wave: 'triangle', freq: 1047, duration: 0.2, delay: 0.1, gain: 0.08 },
    ],
    hit: [{ wave: 'sawtooth', freq: 200, freqEnd: 60, duration: 0.6, gain: 0.12 }],
    fall: [{ wave: 'sine', freq: 700, freqEnd: 100, duration: 0.9, gain: 0.1 }],
  },
  result: (s) => ({ outcome: 'complete', score: scoreOf(s), mode: 'vertical-jumper' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('spring')) unlock('spring');
    if (s.events.includes('pop')) unlock('pop');
    if (metres(s.top) >= 500) unlock('m500');
    if (metres(s.top) >= 2000) unlock('m2000');
  },
  ending: (s) => [s.cause === 'sprite' ? 'end.sprite' : 'end.fall', { m: metres(s.top) }],
  validate: (d: unknown): d is Climb => isClimb(d),
  strings: {
    en: {
      title: 'Cloud Climber',
      'menu.subtitle':
        'Bounce from cloud to cloud as high as you can. Steer left and right; the sides wrap round.',
      'hud.height': 'Height',
      'hud.pops': 'Pops',
      'end.fall': 'Fell from the clouds at {m} m.',
      'end.sprite': 'Zapped by a storm sprite at {m} m.',
    },
    es: {
      title: 'Escaladora de nubes',
      'menu.subtitle':
        'Rebota de nube en nube lo más alto que puedas. Muévete a izquierda y derecha; los lados se conectan.',
      'hud.height': 'Altura',
      'hud.pops': 'Explotados',
      'end.fall': 'Has caído de las nubes a {m} m.',
      'end.sprite': 'Te ha alcanzado un duende de tormenta a {m} m.',
    },
  },
};
