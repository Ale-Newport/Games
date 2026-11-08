/** Nebula Strike for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  W,
  acePolicy,
  isStrike,
  newStrike,
  stepStrike,
  sweeperPolicy,
  type Enemy,
  type Strike,
  type StrikeAction,
} from './sim';

const STARS = Array.from(
  { length: 50 },
  (_, i) => [(i * 71) % W, (i * 113) % H, 1 + (i % 3)] as const,
);

function enemy(ctx: CanvasRenderingContext2D, e: Enemy, steps: number) {
  const { x, y } = e;
  switch (e.kind) {
    case 'darter':
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(x, y + 7);
      ctx.lineTo(x - 6, y - 5);
      ctx.lineTo(x + 6, y - 5);
      ctx.fill();
      break;
    case 'swooper':
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 4, Math.sin(e.t / 20) * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      break;
    case 'tank':
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x - 12, y - 10, 24, 20);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(x - 8, y - 6, 16, 12);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(x - 2, y + 4, 4, 9);
      break;
    case 'carrier':
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', x, y + 3);
      ctx.textAlign = 'start';
      break;
    case 'boss': {
      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.moveTo(x - 30, y - 10);
      ctx.lineTo(x + 30, y - 10);
      ctx.lineTo(x + 18, y + 18);
      ctx.lineTo(x - 18, y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath();
      ctx.arc(x, y + 2, 7 + Math.sin(steps / 8), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#831843';
      ctx.fillRect(x - 26, y + 8, 6, 12);
      ctx.fillRect(x + 20, y + 8, 6, 12);
      break;
    }
  }
}

export const DEF: ArcadeDef<Strike, StrikeAction> = {
  id: 'vertical-shmup',
  prefix: 'ns',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newStrike(seed),
  step: (s, a) => stepStrike(s, a),
  over: (s) => s.over,
  score: (s) => Math.round(s.score),
  hud: (s) => [
    ['hud.score', Math.round(s.score)],
    ['hud.lives', s.lives],
    ['hud.bombs', s.bombs],
    ['hud.stage', s.stage],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#05020f';
    ctx.fillRect(0, 0, W, H);
    // A drifting nebula and stars at three depths.
    const scroll = reducedMotion ? 0 : s.steps;
    const neb = ctx.createRadialGradient(
      W * 0.3,
      ((scroll * 0.2) % (H + 200)) - 100,
      10,
      W * 0.3,
      ((scroll * 0.2) % (H + 200)) - 100,
      160,
    );
    neb.addColorStop(0, 'rgba(126,34,206,0.35)');
    neb.addColorStop(1, 'rgba(126,34,206,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, W, H);
    for (const [x, y, d] of STARS) {
      ctx.fillStyle = d === 3 ? '#e2e8f0' : d === 2 ? '#94a3b8' : '#475569';
      ctx.fillRect(x, (y + scroll * d * 0.5) % H, 1, d === 3 ? 2 : 1);
    }
    for (const p of s.pickups) {
      ctx.fillStyle = p.kind === 'power' ? '#f97316' : '#ef4444';
      ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      ctx.fillStyle = '#fff7ed';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.kind === 'power' ? 'P' : 'B', p.x, p.y + 3);
      ctx.textAlign = 'start';
    }
    for (const e of s.enemies) if (e.t >= 0) enemy(ctx, e, s.steps);
    const boss = s.enemies.find((e) => e.kind === 'boss');
    if (boss) {
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(20, 6, W - 40, 4);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(20, 6, ((W - 40) * boss.hp) / (160 + (s.stage - 1) * 60), 4);
    }
    ctx.fillStyle = '#67e8f9';
    for (const b of s.shots) ctx.fillRect(b.x - 1, b.y - 4, 2, 7);
    for (const b of s.bullets) {
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf2f8';
      ctx.fillRect(b.x - 0.5, b.y - 0.5, 1, 1);
    }
    // The fighter, blinking while safe; its core is the only part that can be hit.
    if (s.dying > 0) {
      ctx.fillStyle = '#fb923c';
      const p = 90 - s.dying;
      for (let k = 0; k < 8; k++)
        ctx.fillRect(s.x + Math.cos(k) * p * 0.6, s.y + Math.sin(k) * p * 0.6, 2, 2);
    } else if (!s.over && !(s.safe > 0 && Math.floor(s.safe / 5) % 2 === 0)) {
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 10);
      ctx.lineTo(s.x + 9, s.y + 8);
      ctx.lineTo(s.x, s.y + 4);
      ctx.lineTo(s.x - 9, s.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(s.x, s.y + 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash / 60})`;
      ctx.fillRect(0, 0, W, H);
    }
  },
  control(s, held, pointer) {
    if (held.has('alt')) return 'bomb';
    if (pointer) {
      // The fighter follows the finger, a little above it so the finger does not hide it.
      const dx = pointer.x - s.x;
      const dy = pointer.y - 40 - s.y;
      const h = Math.abs(dx) > 3 ? (dx > 0 ? 'right' : 'left') : '';
      const v = Math.abs(dy) > 3 ? (dy > 0 ? 'down' : 'up') : '';
      return ([v, h].filter(Boolean).join('-') || 'idle') as StrikeAction;
    }
    const v = held.has('up') ? 'up' : held.has('down') ? 'down' : '';
    const h =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    return ([v, h].filter(Boolean).join('-') || 'idle') as StrikeAction;
  },
  touch: ['left', 'up', 'down', 'right', 'alt'],
  pointer: true,
  policies: { ace: acePolicy, sweeper: sweeperPolicy },
  sounds: (_p, next) => [
    ...next.events.filter((e) => e !== 'shoot'),
    ...(next.events.includes('shoot') && next.steps % 14 === 0 ? ['shoot'] : []),
  ],
  soundBank: {
    shoot: [{ wave: 'square', freq: 1400, freqEnd: 900, duration: 0.03, gain: 0.02 }],
    kill: [{ wave: 'sawtooth', freq: 300, freqEnd: 80, duration: 0.15, gain: 0.06 }],
    bomb: [{ wave: 'sawtooth', freq: 120, freqEnd: 30, duration: 0.9, gain: 0.14 }],
    pickup: [{ wave: 'triangle', freq: 660, freqEnd: 1320, duration: 0.2, gain: 0.1 }],
    boss: [{ wave: 'sawtooth', freq: 90, duration: 0.8, gain: 0.1 }],
    'boss-down': [
      { wave: 'sawtooth', freq: 200, freqEnd: 40, duration: 1, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.4, delay: 0.8, gain: 0.14 },
    ],
    hit: [{ wave: 'sawtooth', freq: 500, freqEnd: 60, duration: 0.8, gain: 0.12 }],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: Math.round(s.score), mode: 'vertical-shmup' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('pickup')) unlock('pickup');
    if (s.events.includes('boss-down')) unlock('boss');
    if (s.stage >= 3) unlock('stage3');
    if (s.score >= 100000) unlock('score');
  },
  ending: (s) => ['end.over', { n: Math.round(s.score), st: s.stage }],
  validate: (d: unknown): d is Strike => isStrike(d),
  strings: {
    en: {
      title: 'Nebula Strike',
      'menu.subtitle':
        'Fly up through the nebula, blast the waves and the boss at the end, and keep your core out of the fire.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.bombs': 'Bombs',
      'hud.stage': 'Stage',
      'control.alt': 'Bomb',
      'end.over': 'Shot down on stage {st}: {n} points.',
    },
    es: {
      title: 'Asalto nebular',
      'menu.subtitle':
        'Atraviesa la nebulosa, acaba con las oleadas y con el jefe del final, y aleja tu núcleo del fuego.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.bombs': 'Bombas',
      'hud.stage': 'Fase',
      'control.alt': 'Bomba',
      'end.over': 'Derribado en la fase {st}: {n} puntos.',
    },
  },
};
