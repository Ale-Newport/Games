/** Snake Arena for the shared arcade shell: camera, pellets, snakes, leaderboard, minimap, controls. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  ARENA_R,
  HZ,
  isArena,
  length,
  newArena,
  policy,
  radius,
  ranking,
  stepArena,
  toAction,
  type Arena,
  type Level,
  type SnakeAction,
} from './sim';

const W = 800;
const H = 500;

const zoomFor = (mass: number) => Math.max(0.5, 1.05 - (radius(mass) - 9) * 0.024);

function rankOf(a: Arena): [number, number] {
  const r = ranking(a);
  return [r.findIndex((s) => s.id === 0) + 1, r.length];
}

export const SNAKES: ArcadeDef<Arena, SnakeAction> = {
  id: 'snake-arena',
  prefix: 'sa',
  hz: HZ,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [
    { id: 'bots', label: 'menu.bots', values: ['10', '20', '30'], initial: '20' },
    { id: 'level', label: 'menu.level', values: ['easy', 'normal', 'hard'], initial: 'normal' },
  ],
  init: (seed, o) => newArena(seed, Number(o.bots ?? 20), (o.level ?? 'normal') as Level),
  step: stepArena,
  over: (a) => a.over,
  score: (a) => Math.floor(a.snakes[0]!.best),
  hud: (a) => {
    const [rank, of] = rankOf(a);
    return [
      ['hud.length', length(a.snakes[0]!)],
      ['hud.rank', rank ? `${rank}/${of}` : '—'],
      ['hud.kills', a.snakes[0]!.kills],
    ];
  },
  draw(ctx, a, { reducedMotion, t }) {
    const you = a.snakes[0]!;
    const z = zoomFor(you.mass);
    const cx = you.body[0]!;
    const cy = you.body[1]!;
    const halfW = W / 2 / z;
    const halfH = H / 2 / z;
    const inView = (x: number, y: number, m: number) =>
      Math.abs(x - cx) < halfW + m && Math.abs(y - cy) < halfH + m;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-cx, -cy);
    // Dotted floor.
    ctx.fillStyle = '#1c2433';
    const step = 50;
    for (let x = Math.floor((cx - halfW) / step) * step; x < cx + halfW; x += step)
      for (let y = Math.floor((cy - halfH) / step) * step; y < cy + halfH; y += step)
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    // Outside the arena.
    ctx.beginPath();
    ctx.rect(cx - halfW - 10, cy - halfH - 10, halfW * 2 + 20, halfH * 2 + 20);
    ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(150, 20, 40, 0.35)';
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.arc(0, 0, ARENA_R, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = 6;
    ctx.stroke();
    // Pellets.
    for (let i = 0; i < a.food.length; i += 4) {
      const x = a.food[i]!;
      const y = a.food[i + 1]!;
      if (!inView(x, y, 20)) continue;
      const v = a.food[i + 2]!;
      const pr = 2 + Math.sqrt(v) * 2;
      const hue = a.food[i + 3]!;
      if (!reducedMotion) {
        const pulse = 0.18 + 0.12 * Math.sin(a.t * 0.15 + i);
        ctx.fillStyle = `hsla(${hue}, 95%, 60%, ${pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, pr * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `hsl(${hue}, 95%, 62%)`;
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Snakes, yours last (on top).
    const order = [...a.snakes.slice(1), you];
    for (const s of order) {
      if (!s.alive && s.id !== 0) continue;
      const r = radius(s.mass);
      const n = s.body.length / 2;
      const light = s.boost && !reducedMotion ? 12 : 0;
      for (let i = n - 1; i >= 0; i--) {
        const x = s.body[i * 2]!;
        const y = s.body[i * 2 + 1]!;
        if (!inView(x, y, r + 4)) continue;
        const stripe = Math.floor(i / 5) % 2 === 0;
        ctx.fillStyle = s.alive
          ? `hsl(${s.hue}, 80%, ${(stripe ? 56 : 46) + light}%)`
          : 'rgba(120,120,120,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const hx = s.body[0]!;
      const hy = s.body[1]!;
      if (!inView(hx, hy, 60)) continue;
      // Eyes.
      for (const side of [-1, 1]) {
        const ex =
          hx + Math.cos(s.angle) * r * 0.35 + Math.cos(s.angle + (side * Math.PI) / 2) * r * 0.45;
        const ey =
          hy + Math.sin(s.angle) * r * 0.35 + Math.sin(s.angle + (side * Math.PI) / 2) * r * 0.45;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(
          ex + Math.cos(s.angle) * r * 0.12,
          ey + Math.sin(s.angle) * r * 0.12,
          r * 0.16,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (s.alive) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `bold ${Math.round(12 / z)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(s.id === 0 ? t('c.you') : s.name, hx, hy - r - 8 / z);
      }
    }
    ctx.restore();
    // Leaderboard.
    const top = ranking(a).slice(0, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(W - 186, 8, 178, 22 + top.length * 16);
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t('c.leaderboard'), W - 178, 24);
    ctx.font = '11px system-ui, sans-serif';
    top.forEach((s, i) => {
      ctx.fillStyle = s.id === 0 ? '#ffd23f' : 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(`#${i + 1} ${s.id === 0 ? t('c.you') : s.name}`, W - 178, 42 + i * 16);
      ctx.textAlign = 'right';
      ctx.fillText(String(length(s)), W - 16, 42 + i * 16);
    });
    // Your length and rank.
    const [rank, of] = rankOf(a);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(t('c.length', { n: length(you) }), 12, H - 30);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    if (rank) ctx.fillText(t('c.rank', { r: rank, n: of }), 12, H - 12);
    // Minimap.
    const mx = W - 64;
    const my = H - 64;
    const mr = 54;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    for (const s of a.snakes) {
      if (!s.alive || s.id === 0) continue;
      ctx.fillStyle = `hsla(${s.hue}, 80%, 60%, 0.7)`;
      const size = 1.5 + Math.min(3, radius(s.mass) / 8);
      ctx.fillRect(
        mx + (s.body[0]! / ARENA_R) * mr - size / 2,
        my + (s.body[1]! / ARENA_R) * mr - size / 2,
        size,
        size,
      );
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mx + (cx / ARENA_R) * mr, my + (cy / ARENA_R) * mr, 3, 0, Math.PI * 2);
    ctx.fill();
  },
  control(a, held, pointer) {
    const boost =
      held.has('fire') || held.has('up') || (pointer?.down === true && pointer.mouse === true);
    const b = boost ? 'b' : '';
    if (held.has('left') && !held.has('right')) return `l${b}`;
    if (held.has('right') && !held.has('left')) return `r${b}`;
    if (pointer) {
      const dx = pointer.x - W / 2;
      const dy = pointer.y - H / 2;
      if (Math.hypot(dx, dy) > 6) return toAction({ angle: Math.atan2(dy, dx), boost });
    }
    void a;
    return boost ? 'b' : 'idle';
  },
  touch: ['left', 'right', 'fire'],
  pointer: true,
  hover: true,
  policies: { hunter: (a) => policy(a, 'hard'), forager: (a) => policy(a, 'easy') },
  sounds(_prev, next) {
    return next.events.filter((e) => e !== 'eat' || next.t % 3 === 0);
  },
  soundBank: {
    eat: [{ wave: 'sine', freq: 880, duration: 0.03, gain: 0.03 }],
    gulp: [{ wave: 'triangle', freq: 440, freqEnd: 880, duration: 0.1, gain: 0.08 }],
    boost: [{ wave: 'noise', freq: 0, duration: 0.15, gain: 0.05, lowpass: 900 }],
    kill: [
      { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.14 },
      { wave: 'triangle', freq: 990, duration: 0.2, delay: 0.08, gain: 0.14 },
    ],
    die: [{ wave: 'sawtooth', freq: 300, freqEnd: 80, duration: 0.5, gain: 0.1 }],
  },
  result: (a, o) => ({
    outcome: 'complete',
    score: Math.floor(a.snakes[0]!.best),
    mode: `${o.bots ?? 20}-${o.level ?? 'normal'}`,
  }),
  achievements(a, _o, unlock) {
    const best = a.snakes[0]!.best;
    if (best >= 100) unlock('length-100');
    if (best >= 500) unlock('length-500');
    if (best >= 1000) unlock('length-1000');
    if (a.snakes[0]!.kills >= 1) unlock('kill');
    if (a.snakes[0]!.kills >= 5) unlock('kills-5');
    if (a.bestRank === 1) unlock('top');
  },
  ending: (a) =>
    a.killedBy
      ? ['end.killed', { who: a.killedBy, n: Math.floor(a.snakes[0]!.best) }]
      : ['end.wall', { n: Math.floor(a.snakes[0]!.best) }],
  validate: isArena,
  strings: {
    en: {
      title: 'Snake Arena',
      'menu.subtitle':
        'Glide around a giant arena eating glowing pellets to grow. Steer with the mouse (or arrows), boost with a click or Space — and make other snakes crash into you.',
      'menu.bots': 'Snakes',
      'bots.10': '10',
      'bots.20': '20',
      'bots.30': '30',
      'bots.10.hint': 'A quiet arena.',
      'bots.20.hint': 'A busy arena.',
      'bots.30.hint': 'A crowded arena.',
      'menu.level': 'Bots',
      'level.easy': 'Easy',
      'level.normal': 'Normal',
      'level.hard': 'Hard',
      'level.easy.hint': 'Grazers: they eat and dodge but never hunt.',
      'level.normal.hint': 'Some of them try to cut in front of smaller snakes.',
      'level.hard.hint': 'Big, alert hunters that boost to cut you off.',
      'hud.length': 'Length',
      'hud.rank': 'Rank',
      'hud.kills': 'Kills',
      'c.you': 'You',
      'c.leaderboard': 'Leaderboard',
      'c.length': 'Your length: {n}',
      'c.rank': 'Rank {r} of {n}',
      'end.killed': 'You crashed into {who}. Best length {n}.',
      'end.wall': 'You hit the wall. Best length {n}.',
    },
    es: {
      title: 'Arena de serpientes',
      'menu.subtitle':
        'Deslízate por una arena gigante comiendo bolitas brillantes para crecer. Dirige con el ratón (o las flechas), acelera con clic o Espacio… y haz que las demás serpientes choquen contigo.',
      'menu.bots': 'Serpientes',
      'bots.10': '10',
      'bots.20': '20',
      'bots.30': '30',
      'bots.10.hint': 'Una arena tranquila.',
      'bots.20.hint': 'Una arena animada.',
      'bots.30.hint': 'Una arena abarrotada.',
      'menu.level': 'Bots',
      'level.easy': 'Fácil',
      'level.normal': 'Normal',
      'level.hard': 'Difícil',
      'level.easy.hint': 'Pastan: comen y esquivan, pero nunca cazan.',
      'level.normal.hint': 'Algunas intentan cruzarse delante de serpientes más pequeñas.',
      'level.hard.hint': 'Cazadoras grandes y atentas que aceleran para cortarte el paso.',
      'hud.length': 'Longitud',
      'hud.rank': 'Puesto',
      'hud.kills': 'Bajas',
      'c.you': 'Tú',
      'c.leaderboard': 'Clasificación',
      'c.length': 'Tu longitud: {n}',
      'c.rank': 'Puesto {r} de {n}',
      'end.killed': 'Chocaste contra {who}. Mejor longitud: {n}.',
      'end.wall': 'Chocaste contra el muro. Mejor longitud: {n}.',
    },
  },
};
