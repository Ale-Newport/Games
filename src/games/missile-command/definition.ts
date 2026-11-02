/** City Shield for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  CITY_X,
  GROUND,
  H,
  LAUNCHER_X,
  W,
  blastRadius,
  cellOf,
  defenderPolicy,
  isShield,
  multiplier,
  newShield,
  sniperPolicy,
  stepShield,
  type Shield,
  type ShieldAction,
} from './sim';

const BLAST_COLOURS = ['#fde047', '#fb923c', '#f472b6', '#a5f3fc'];

function city(ctx: CanvasRenderingContext2D, x: number, alive: boolean) {
  if (!alive) {
    ctx.fillStyle = '#57534e';
    ctx.fillRect(x - 9, GROUND - 3, 18, 3);
    ctx.fillRect(x - 5, GROUND - 5, 5, 2);
    return;
  }
  const blocks: [number, number, number][] = [
    [-9, 5, 8],
    [-4, 4, 13],
    [0, 5, 10],
    [5, 4, 6],
  ];
  for (const [dx, w, h] of blocks) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + dx, GROUND - h, w, h);
    ctx.fillStyle = '#fde68a';
    for (let y = GROUND - h + 2; y < GROUND - 2; y += 3) ctx.fillRect(x + dx + 1, y, 1, 1);
  }
}

function launcher(ctx: CanvasRenderingContext2D, x: number, up: boolean, rounds: number) {
  ctx.fillStyle = up ? '#64748b' : '#3f3f46';
  ctx.beginPath();
  ctx.arc(x, GROUND, 9, Math.PI, 0);
  ctx.fill();
  if (!up) return;
  ctx.fillStyle = '#38bdf8';
  for (let k = 0; k < rounds; k++)
    ctx.fillRect(x - 9 + (k % 5) * 4, GROUND + 4 + Math.floor(k / 5) * 4, 2, 2);
}

export const DEF: ArcadeDef<Shield, ShieldAction> = {
  id: 'missile-command',
  prefix: 'mc2',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newShield(seed),
  step: (s, a) => stepShield(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.wave', s.wave],
    ['hud.cities', s.cities.filter(Boolean).length],
  ],
  draw(ctx, s, { reducedMotion }) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3f6212';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#365314';
    for (let x = 0; x < W; x += 12) ctx.fillRect(x, GROUND + 6, 6, 2);
    CITY_X.forEach((x, i) => city(ctx, x, s.cities[i]!));
    LAUNCHER_X.forEach((x, i) => launcher(ctx, x, s.launchers[i]!.up, s.launchers[i]!.rounds));
    // Rocket trails and heads.
    ctx.lineWidth = 1;
    for (const r of s.rockets) {
      ctx.strokeStyle = 'rgba(248,113,113,0.7)';
      ctx.beginPath();
      ctx.moveTo(r.sx, r.sy);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
      ctx.fillStyle = reducedMotion || s.steps % 6 < 3 ? '#fef2f2' : '#f87171';
      ctx.fillRect(r.x - 1, r.y - 1, 2, 2);
    }
    for (const it of s.interceptors) {
      ctx.strokeStyle = 'rgba(56,189,248,0.8)';
      ctx.beginPath();
      ctx.moveTo(it.sx, it.sy);
      ctx.lineTo(it.x, it.y);
      ctx.stroke();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(it.x - 1, it.y - 1, 2, 2);
      // The point it is heading for.
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(it.tx - 3, it.ty - 3);
      ctx.lineTo(it.tx + 3, it.ty + 3);
      ctx.moveTo(it.tx + 3, it.ty - 3);
      ctx.lineTo(it.tx - 3, it.ty + 3);
      ctx.stroke();
    }
    for (const b of s.blasts) {
      ctx.fillStyle = reducedMotion
        ? BLAST_COLOURS[0]!
        : BLAST_COLOURS[Math.floor(b.age / 3) % BLAST_COLOURS.length]!;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(0.5, blastRadius(b)), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The crosshair.
    const [cx, cy] = s.cross;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx - 2, cy);
    ctx.moveTo(cx + 2, cy);
    ctx.lineTo(cx + 6, cy);
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx, cy - 2);
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx, cy + 6);
    ctx.stroke();
    if (s.between > 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${s.bonus}`, W / 2, 90);
      ctx.font = '10px sans-serif';
      ctx.fillText(`×${multiplier(s.wave + 1)}`, W / 2, 106);
      ctx.textAlign = 'start';
    }
  },
  control(_s, held, pointer) {
    if (pointer) {
      const [c, r] = cellOf(pointer.x, pointer.y);
      return `at-${c}-${r}`;
    }
    if (held.has('fire')) return 'fire';
    const v = held.has('up') ? 'up' : held.has('down') ? 'down' : '';
    const h = held.has('left') ? 'left' : held.has('right') ? 'right' : '';
    const dir = [v, h].filter(Boolean).join('-');
    return (dir || 'idle') as ShieldAction;
  },
  touch: [],
  pointer: true,
  policies: { defender: defenderPolicy, sniper: sniperPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    launch: [{ wave: 'square', freq: 880, freqEnd: 440, duration: 0.08, gain: 0.04 }],
    burst: [{ wave: 'sawtooth', freq: 160, freqEnd: 60, duration: 0.3, gain: 0.08 }],
    hit: [{ wave: 'triangle', freq: 660, freqEnd: 330, duration: 0.12, gain: 0.07 }],
    split: [{ wave: 'square', freq: 300, freqEnd: 600, duration: 0.1, gain: 0.04 }],
    'city-lost': [{ wave: 'sawtooth', freq: 220, freqEnd: 40, duration: 0.8, gain: 0.12 }],
    'launcher-lost': [{ wave: 'sawtooth', freq: 180, freqEnd: 50, duration: 0.6, gain: 0.1 }],
    dry: [{ wave: 'square', freq: 120, duration: 0.08, gain: 0.05 }],
    cleared: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.25, delay: 0.12, gain: 0.14 },
    ],
    rebuilt: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'missile-command' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('cleared')) unlock('wave');
    if (s.events.includes('cleared') && s.cities.every(Boolean)) unlock('intact');
    if (s.wave >= 10) unlock('ten');
    if (s.score >= 25000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, w: s.wave }],
  validate: (d: unknown): d is Shield => isShield(d),
  strings: {
    en: {
      title: 'City Shield',
      'menu.subtitle':
        'Rockets are falling on six cities. Tap the sky to send interceptors there — their blasts stop anything inside.',
      'hud.score': 'Score',
      'hud.wave': 'Wave',
      'hud.cities': 'Cities',
      'end.over': 'Every city has fallen on wave {w}: {n} points.',
    },
    es: {
      title: 'Escudo urbano',
      'menu.subtitle':
        'Caen cohetes sobre seis ciudades. Toca el cielo para lanzar interceptores allí: sus explosiones detienen todo lo que atrapan.',
      'hud.score': 'Puntos',
      'hud.wave': 'Oleada',
      'hud.cities': 'Ciudades',
      'end.over': 'Todas las ciudades han caído en la oleada {w}: {n} puntos.',
    },
  },
};
