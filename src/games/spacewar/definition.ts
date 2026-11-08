/** Star Duel for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  CX,
  CY,
  H,
  KILLS_TO_WIN,
  STAR_R,
  W,
  duellistFor,
  gunnerFor,
  isDuel,
  newDuel,
  stepWithRival,
  type Duel,
  type DuelAction,
  type Ship,
} from './sim';

const COLOURS = ['#22d3ee', '#f59e0b'];
const STARS = Array.from(
  { length: 70 },
  (_, i) => [(i * 89) % W, (i * 61 + (i % 5) * 17) % H, i % 3] as const,
);

function ship(
  ctx: CanvasRenderingContext2D,
  sh: Ship,
  i: number,
  x: number,
  y: number,
  steps: number,
  reducedMotion: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sh.a);
  if (sh.thrusting) {
    ctx.fillStyle = '#fb923c';
    const len = reducedMotion ? 6 : 5 + (steps % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-6 - len, 0);
    ctx.lineTo(-6, 2);
    ctx.fill();
  }
  ctx.strokeStyle = COLOURS[i]!;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (i === 0) {
    // A slim arrow.
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 4);
  } else {
    // A broad wedge.
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export const DEF: ArcadeDef<Duel, DuelAction> = {
  id: 'spacewar',
  prefix: 'sd',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newDuel(seed),
  step: (s, a) => stepWithRival(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.kills', `${s.ships[0]!.kills}–${s.ships[1]!.kills}`],
    ['hud.jumps', 3 - s.ships[0]!.jumps],
    ['hud.score', s.score],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);
    for (const [x, y, k] of STARS) {
      ctx.fillStyle = k === 0 ? '#e2e8f0' : k === 1 ? '#64748b' : '#334155';
      ctx.fillRect(x, y, 1, 1);
    }
    // The star, flickering.
    const flick = reducedMotion ? 0 : Math.sin(s.steps / 4) * 1.5;
    ctx.fillStyle = 'rgba(253,224,71,0.18)';
    ctx.beginPath();
    ctx.arc(CX, CY, STAR_R * 2.2 + flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(CX, CY, STAR_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(CX, CY, STAR_R * 0.5, 0, Math.PI * 2);
    ctx.fill();
    for (const t of s.torpedoes) {
      ctx.fillStyle = COLOURS[t.owner]!;
      ctx.fillRect(t.x - 1, t.y - 1, 2.5, 2.5);
    }
    s.ships.forEach((sh, i) => {
      if (!sh.alive) {
        // Debris for a moment.
        if (s.pause > 60) {
          ctx.fillStyle = COLOURS[i]!;
          const p = 120 - s.pause;
          for (let k = 0; k < 6; k++)
            ctx.fillRect(sh.x + Math.cos(k) * p * 0.4, sh.y + Math.sin(k) * p * 0.4, 2, 2);
        }
        return;
      }
      if (sh.hyper > 0) return;
      for (const ox of [-W, 0, W])
        for (const oy of [-H, 0, H]) {
          const x = sh.x + ox;
          const y = sh.y + oy;
          if (x > -12 && x < W + 12 && y > -12 && y < H + 12)
            ship(ctx, sh, i, x, y, s.steps, reducedMotion);
        }
    });
    if (s.pause > 0 && s.pause < 60) {
      ctx.fillStyle = s.lastKill !== null && s.lastKill >= 0 ? COLOURS[s.lastKill]! : '#e2e8f0';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.ships[0]!.kills} – ${s.ships[1]!.kills}`, W / 2, 30);
      ctx.textAlign = 'start';
    }
  },
  control(_s, held) {
    if (held.has('alt') || held.has('down')) return 'hyper';
    if (held.has('fire')) return 'fire';
    const turn =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    if (held.has('up')) return (turn ? `thrust-${turn}` : 'thrust') as DuelAction;
    return (turn || 'idle') as DuelAction;
  },
  touch: ['left', 'up', 'right', 'fire', 'alt'],
  pointer: false,
  policies: { duellist: (s) => duellistFor(s, 0), gunner: (s) => gunnerFor(s, 0) },
  sounds: (_p, next) => [
    ...next.events,
    ...(next.ships[0]!.thrusting && next.steps % 8 === 0 ? ['engine'] : []),
  ],
  soundBank: {
    engine: [{ wave: 'sawtooth', freq: 80, duration: 0.08, gain: 0.03 }],
    fire: [{ wave: 'square', freq: 1200, freqEnd: 500, duration: 0.08, gain: 0.05 }],
    'rival-fire': [{ wave: 'square', freq: 900, freqEnd: 400, duration: 0.08, gain: 0.04 }],
    hyper: [{ wave: 'sine', freq: 200, freqEnd: 1600, duration: 0.4, gain: 0.08 }],
    emerge: [{ wave: 'sine', freq: 1600, freqEnd: 400, duration: 0.3, gain: 0.07 }],
    kill: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.12, gain: 0.16 },
    ],
    killed: [{ wave: 'sawtooth', freq: 400, freqEnd: 60, duration: 0.8, gain: 0.12 }],
    both: [{ wave: 'sawtooth', freq: 300, freqEnd: 60, duration: 0.8, gain: 0.1 }],
  },
  result: (s) => ({
    outcome: s.ships[0]!.kills >= KILLS_TO_WIN ? 'win' : 'loss',
    score: s.score,
    mode: 'vs-ai',
  }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('kill')) unlock('kill');
    if (s.events.includes('rival-burnt')) unlock('star');
    if (s.over && s.ships[0]!.kills >= KILLS_TO_WIN) unlock('match');
    if (s.over && s.ships[0]!.kills >= KILLS_TO_WIN && s.ships[1]!.kills === 0) unlock('flawless');
  },
  ending: (s) =>
    s.ships[0]!.kills >= KILLS_TO_WIN
      ? ['end.won', { a: s.ships[0]!.kills, b: s.ships[1]!.kills }]
      : ['end.lost', { a: s.ships[0]!.kills, b: s.ships[1]!.kills }],
  validate: (d: unknown): d is Duel => isDuel(d),
  strings: {
    en: {
      title: 'Star Duel',
      'menu.subtitle':
        'Two ships, one star, no mercy. Mind the gravity well and land five hits first.',
      'hud.kills': 'Kills',
      'hud.jumps': 'Jumps',
      'hud.score': 'Score',
      'control.up': 'Thrust',
      'control.fire': 'Fire',
      'control.alt': 'Hyperspace',
      'end.won': 'You won the duel {a}–{b}!',
      'end.lost': 'You lost the duel {a}–{b}.',
    },
    es: {
      title: 'Duelo estelar',
      'menu.subtitle':
        'Dos naves, una estrella y ninguna piedad. Cuidado con su gravedad y acierta cinco veces antes.',
      'hud.kills': 'Bajas',
      'hud.jumps': 'Saltos',
      'hud.score': 'Puntos',
      'control.up': 'Motor',
      'control.fire': 'Disparar',
      'control.alt': 'Hiperespacio',
      'end.won': '¡Has ganado el duelo {a}–{b}!',
      'end.lost': 'Has perdido el duelo {a}–{b}.',
    },
  },
};
