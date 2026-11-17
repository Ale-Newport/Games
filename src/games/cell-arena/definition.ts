/** Cell Arena for the shared arcade shell: camera, grid, pellets, cells, viruses, leaderboard, minimap. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  actionFor,
  botAction,
  centre,
  HALF,
  HZ,
  isDish,
  massOf,
  newDish,
  radius,
  ranking,
  stepDish,
  type Dish,
  type Level,
} from './sim';

const W = 800;
const H = 500;

function view(d: Dish): [number, number, number] {
  const [cx, cy] = centre(d, 0);
  const own = d.cells.filter((c) => c.owner === 0);
  const total = Math.max(12, massOf(d, 0));
  let z = Math.max(0.3, Math.min(1.1, 1.1 * Math.pow(12 / total, 0.2)));
  let spread = 0;
  for (const c of own) spread = Math.max(spread, Math.hypot(c.x - cx, c.y - cy) + radius(c.mass));
  if (spread) z = Math.max(0.25, Math.min(z, (H * 0.42) / spread));
  return [cx, cy, z];
}

function rankOf(d: Dish): [number, number] {
  const r = ranking(d);
  return [r.findIndex((x) => x.p.id === 0) + 1, r.length];
}

function spiky(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const spikes = 22;
  ctx.beginPath();
  for (let i = 0; i <= spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 ? r : r + 5;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(60, 220, 90, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#2f9e44';
  ctx.lineWidth = 4;
  ctx.stroke();
}

export const CELLS: ArcadeDef<Dish, string> = {
  id: 'cell-arena',
  prefix: 'ca',
  hz: HZ,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [
    { id: 'bots', label: 'menu.bots', values: ['10', '15', '25'], initial: '15' },
    { id: 'level', label: 'menu.level', values: ['easy', 'normal', 'hard'], initial: 'normal' },
  ],
  init: (seed, o) => newDish(seed, Number(o.bots ?? 15), (o.level ?? 'normal') as Level),
  step: stepDish,
  over: (d) => d.over,
  score: (d) => Math.floor(d.players[0]!.best),
  hud: (d) => {
    const [rank, of] = rankOf(d);
    return [
      ['hud.mass', Math.floor(massOf(d, 0))],
      ['hud.cells', d.cells.filter((c) => c.owner === 0).length],
      ['hud.rank', rank ? `${rank}/${of}` : '—'],
    ];
  },
  draw(ctx, d, { t }) {
    const [cx, cy, z] = view(d);
    const halfW = W / 2 / z;
    const halfH = H / 2 / z;
    const inView = (x: number, y: number, m: number) =>
      Math.abs(x - cx) < halfW + m && Math.abs(y - cy) < halfH + m;
    ctx.fillStyle = '#0f1520';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-cx, -cy);
    // Dish area and grid.
    ctx.fillStyle = '#151d2b';
    ctx.fillRect(-HALF, -HALF, HALF * 2, HALF * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1 / z;
    const step = 50;
    ctx.beginPath();
    for (
      let x = Math.max(-HALF, Math.floor((cx - halfW) / step) * step);
      x <= Math.min(HALF, cx + halfW);
      x += step
    ) {
      ctx.moveTo(x, Math.max(-HALF, cy - halfH));
      ctx.lineTo(x, Math.min(HALF, cy + halfH));
    }
    for (
      let y = Math.max(-HALF, Math.floor((cy - halfH) / step) * step);
      y <= Math.min(HALF, cy + halfH);
      y += step
    ) {
      ctx.moveTo(Math.max(-HALF, cx - halfW), y);
      ctx.lineTo(Math.min(HALF, cx + halfW), y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = 4 / z;
    ctx.strokeRect(-HALF, -HALF, HALF * 2, HALF * 2);
    // Pellets.
    for (let i = 0; i < d.food.length; i += 3) {
      const x = d.food[i]!;
      const y = d.food[i + 1]!;
      if (!inView(x, y, 10)) continue;
      ctx.fillStyle = `hsl(${d.food[i + 2]}, 90%, 60%)`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ejected blobs.
    for (const b of d.blobs) {
      if (b.virus || !inView(b.x, b.y, 30)) continue;
      ctx.fillStyle = `hsl(${b.hue}, 75%, 55%)`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, radius(b.mass), 0, Math.PI * 2);
      ctx.fill();
    }
    // Cells, smaller on top of bigger ones.
    const names = new Map(d.players.map((p) => [p.id, p]));
    const sorted = [...d.cells].sort((a, b) => a.mass - b.mass);
    const viruses = d.blobs.filter((b) => b.virus);
    const drawCell = (c: (typeof sorted)[number]) => {
      const r = radius(c.mass);
      if (!inView(c.x, c.y, r)) return;
      const p = names.get(c.owner)!;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${p.hue}, 75%, 55%)`;
      ctx.fill();
      ctx.lineWidth = Math.max(3, r * 0.06);
      ctx.strokeStyle = `hsl(${p.hue}, 70%, 40%)`;
      ctx.stroke();
      if (r * z > 14) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = Math.max(2, r * 0.05);
        ctx.textAlign = 'center';
        const size = Math.max(10, r * 0.38);
        ctx.font = `bold ${size}px system-ui, sans-serif`;
        const label = c.owner === 0 ? t('c.you') : p.name;
        ctx.strokeText(label, c.x, c.y + size * 0.35);
        ctx.fillText(label, c.x, c.y + size * 0.35);
        if (c.owner === 0 && r * z > 22) {
          ctx.font = `bold ${size * 0.55}px system-ui, sans-serif`;
          ctx.strokeText(String(Math.floor(c.mass)), c.x, c.y + size * 1.1);
          ctx.fillText(String(Math.floor(c.mass)), c.x, c.y + size * 1.1);
        }
      }
    };
    // Cells smaller than a virus hide under it; bigger ones are drawn over it.
    for (const c of sorted) if (c.mass < 100) drawCell(c);
    for (const v of viruses) if (inView(v.x, v.y, 80)) spiky(ctx, v.x, v.y, radius(v.mass));
    for (const c of sorted) if (c.mass >= 100) drawCell(c);
    ctx.restore();
    // Leaderboard.
    const top = ranking(d).slice(0, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(W - 186, 8, 178, 22 + top.length * 16);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(t('c.leaderboard'), W - 178, 24);
    ctx.font = '11px system-ui, sans-serif';
    top.forEach((r, i) => {
      ctx.fillStyle = r.p.id === 0 ? '#ffd23f' : 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${r.p.id === 0 ? t('c.you') : r.p.name}`, W - 178, 42 + i * 16);
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.floor(r.mass)), W - 16, 42 + i * 16);
    });
    const [rank, of] = rankOf(d);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(t('c.score', { n: Math.floor(massOf(d, 0)) }), 12, H - 30);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    if (rank) ctx.fillText(t('c.rank', { r: rank, n: of }), 12, H - 12);
    // Minimap.
    const ms = 100;
    const mx = W - ms - 10;
    const my = H - ms - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(mx, my, ms, ms);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, ms, ms);
    for (const r of ranking(d).slice(0, 10)) {
      if (r.p.id === 0) continue;
      const [px, py] = centre(d, r.p.id);
      ctx.fillStyle = `hsla(${r.p.hue}, 75%, 60%, 0.8)`;
      ctx.fillRect(
        mx + ((px + HALF) / (HALF * 2)) * ms - 2,
        my + ((py + HALF) / (HALF * 2)) * ms - 2,
        4,
        4,
      );
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
      mx + ((cx + HALF) / (HALF * 2)) * ms,
      my + ((cy + HALF) / (HALF * 2)) * ms,
      3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  },
  control(_d, held, pointer) {
    const extra = held.has('fire') ? 's' : held.has('alt') ? 'w' : '';
    const dx = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    const dy = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
    if (dx || dy) return actionFor(Math.atan2(dy, dx), extra);
    if (pointer) {
      const px = pointer.x - W / 2;
      const py = pointer.y - H / 2;
      if (Math.hypot(px, py) > 8) return actionFor(Math.atan2(py, px), extra);
    }
    return actionFor(null, extra);
  },
  touch: ['fire', 'alt'],
  pointer: true,
  hover: true,
  policies: { hunter: (d) => botAction(d, 0, 'hard'), grazer: (d) => botAction(d, 0, 'easy') },
  sounds: (_p, next) => next.events,
  soundBank: {
    eat: [{ wave: 'sine', freq: 990, duration: 0.02, gain: 0.025 }],
    gulp: [{ wave: 'triangle', freq: 330, freqEnd: 660, duration: 0.12, gain: 0.1 }],
    split: [{ wave: 'square', freq: 520, freqEnd: 260, duration: 0.08, gain: 0.06 }],
    eject: [{ wave: 'sine', freq: 300, duration: 0.04, gain: 0.05 }],
    merge: [{ wave: 'sine', freq: 440, freqEnd: 660, duration: 0.15, gain: 0.06 }],
    pop: [{ wave: 'noise', freq: 0, duration: 0.25, gain: 0.12, lowpass: 1500 }],
    lost: [{ wave: 'sawtooth', freq: 260, freqEnd: 130, duration: 0.2, gain: 0.08 }],
    kill: [
      { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.14 },
      { wave: 'triangle', freq: 990, duration: 0.2, delay: 0.08, gain: 0.14 },
    ],
    die: [{ wave: 'sawtooth', freq: 300, freqEnd: 80, duration: 0.5, gain: 0.1 }],
  },
  result: (d, o) => ({
    outcome: 'complete',
    score: Math.floor(d.players[0]!.best),
    mode: `${o.bots ?? 15}-${o.level ?? 'normal'}`,
  }),
  achievements(d, _o, unlock) {
    const best = d.players[0]!.best;
    if (best >= 200) unlock('mass-200');
    if (best >= 1000) unlock('mass-1000');
    if (best >= 3000) unlock('mass-3000');
    if (d.players[0]!.kills >= 1) unlock('kill');
    if (d.players[0]!.kills >= 5) unlock('kills-5');
    if (d.bestRank === 1) unlock('top');
  },
  ending: (d) =>
    d.killedBy
      ? ['end.eaten', { who: d.killedBy, n: Math.floor(d.players[0]!.best) }]
      : ['end.gone', { n: Math.floor(d.players[0]!.best) }],
  validate: isDish,
  strings: {
    en: {
      title: 'Cell Arena',
      'menu.subtitle':
        'Eat pellets and smaller cells to grow, and stay away from bigger ones. Steer with the mouse or arrows; Space splits, X or Shift ejects mass.',
      'menu.bots': 'Cells',
      'bots.10': '10',
      'bots.15': '15',
      'bots.25': '25',
      'menu.level': 'Bots',
      'level.easy': 'Easy',
      'level.normal': 'Normal',
      'level.hard': 'Hard',
      'level.easy.hint': 'Short-sighted grazers that never split.',
      'level.normal.hint': 'They chase smaller cells and sometimes split to catch them.',
      'level.hard.hint': 'Far-sighted hunters that split-kill and flee early.',
      'hud.mass': 'Mass',
      'hud.cells': 'Cells',
      'hud.rank': 'Rank',
      'c.you': 'You',
      'c.leaderboard': 'Leaderboard',
      'c.score': 'Score: {n}',
      'c.rank': 'Rank {r} of {n}',
      'end.eaten': 'You were eaten by {who}. Best mass {n}.',
      'end.gone': 'Your cells are gone. Best mass {n}.',
    },
    es: {
      title: 'Arena de células',
      'menu.subtitle':
        'Come bolitas y células más pequeñas para crecer, y huye de las grandes. Dirige con el ratón o las flechas; Espacio divide, X o Mayús expulsa masa.',
      'menu.bots': 'Células',
      'bots.10': '10',
      'bots.15': '15',
      'bots.25': '25',
      'menu.level': 'Bots',
      'level.easy': 'Fácil',
      'level.normal': 'Normal',
      'level.hard': 'Difícil',
      'level.easy.hint': 'Pastan, ven poco y nunca se dividen.',
      'level.normal.hint': 'Persiguen células pequeñas y a veces se dividen para atraparlas.',
      'level.hard.hint': 'Cazadoras que ven lejos, se dividen para matar y huyen a tiempo.',
      'hud.mass': 'Masa',
      'hud.cells': 'Células',
      'hud.rank': 'Puesto',
      'c.you': 'Tú',
      'c.leaderboard': 'Clasificación',
      'c.score': 'Puntos: {n}',
      'c.rank': 'Puesto {r} de {n}',
      'end.eaten': 'Te comió {who}. Mejor masa: {n}.',
      'end.gone': 'No te quedan células. Mejor masa: {n}.',
    },
  },
};
