/** Wanderer Rescue for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  BAR,
  CELL,
  COLS,
  EARTH,
  H,
  LEVELS,
  ROWS,
  LIMIT,
  SKILLS,
  STEEL,
  TICK,
  W,
  WATER,
  cellAt,
  idlePolicy,
  isRescue,
  newRescue,
  plannerPolicy,
  stepRescue,
  type Rescue,
  type RescueAction,
  type Skill,
  type Walker,
} from './sim';

const MAP_H = ROWS * CELL;
const ICON: Record<Skill, string> = {
  climb: '↑',
  float: '☂',
  block: '✋',
  dig: '↓',
  bash: '→',
  build: '⌒',
};

function wanderer(ctx: CanvasRenderingContext2D, w: Walker, ticks: number, reducedMotion: boolean) {
  const x = w.x * CELL + CELL / 2;
  const y = (w.y + 1) * CELL;
  const step = reducedMotion ? 0 : ticks % 2;
  // Legs, body, face and green hair.
  ctx.fillStyle = '#1e3a8a';
  if (w.state === 'walk' || w.state === 'bash') {
    ctx.fillRect(x - 1.5 + step, y - 2, 1, 2);
    ctx.fillRect(x + 0.5 - step, y - 2, 1, 2);
  } else ctx.fillRect(x - 1.5, y - 2, 3, 2);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(x - 1.5, y - 5, 3, 3);
  ctx.fillStyle = '#fcd9b6';
  ctx.fillRect(x - 1, y - 7, 2, 2);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x - 1.5 + (w.dir > 0 ? -0.5 : 0.5), y - 8, 3, 1.5);
  ctx.fillStyle = '#e2e8f0';
  switch (w.state) {
    case 'block':
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x - 4, y - 5, 8, 1.5);
      break;
    case 'dig':
      ctx.fillRect(x - 0.5, y - 1, 1, 3);
      break;
    case 'bash':
      ctx.fillRect(x + w.dir * 2, y - 4, w.dir * 2, 1.5);
      break;
    case 'build':
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + w.dir * 2 - 1, y - 3, 2, 1.5);
      break;
    case 'fall':
      if (w.floater) {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(x, y - 9, 4, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x - 0.25, y - 9, 0.5, 4);
      }
      break;
  }
}

export const DEF: ArcadeDef<Rescue, RescueAction> = {
  id: 'rescue-walkers',
  prefix: 'wr',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [
    { id: 'start', label: 'menu.start', values: LEVELS.map((_, i) => `${i + 1}`), initial: '1' },
  ],
  init: (seed, o) =>
    newRescue(seed, Math.max(0, Math.min(LEVELS.length - 1, Number(o.start ?? '1') - 1))),
  step: (s, a) => stepRescue(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.level', `${s.level.index + 1}/${LEVELS.length}`],
    ['hud.saved', `${s.level.saved}/${LEVELS[s.level.index]!.need}`],
    ['hud.lives', s.lives],
  ],
  draw(ctx, s, { reducedMotion }) {
    const lv = s.level;
    const def = LEVELS[lv.index]!;
    const bg = ctx.createLinearGradient(0, 0, 0, MAP_H);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(1, '#312e81');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, MAP_H);
    // Terrain, cell by cell: earth with a mossy top, riveted steel, rippling water.
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const c = cellAt(lv, x, y);
        if (c === EARTH) {
          ctx.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#78350f' : '#92400e';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          if (y > 0 && cellAt(lv, x, y - 1) !== EARTH && cellAt(lv, x, y - 1) !== STEEL) {
            ctx.fillStyle = '#65a30d';
            ctx.fillRect(x * CELL, y * CELL, CELL, 1.5);
          }
        } else if (c === STEEL) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x * CELL + 1, y * CELL + 1, 1, 1);
        } else if (c === WATER) {
          ctx.fillStyle =
            (x + y + (reducedMotion ? 0 : Math.floor(lv.ticks / 3))) % 4 === 0
              ? '#38bdf8'
              : '#0284c7';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    // The hatch and the exit.
    const [hx, hy] = def.hatch;
    ctx.fillStyle = '#a16207';
    ctx.fillRect(hx * CELL - 8, hy * CELL - 10, 20, 6);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(hx * CELL - 4, hy * CELL - 4, 12, 2);
    const [ex, ey] = def.exit;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(ex * CELL + 2, (ey + 1) * CELL - 8, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(ex * CELL - 5, (ey + 1) * CELL - 8, 14, 8);
    ctx.fillStyle = '#422006';
    ctx.beginPath();
    ctx.arc(ex * CELL + 2, (ey + 1) * CELL - 7, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(ex * CELL - 2, (ey + 1) * CELL - 7, 8, 7);
    lv.walkers.forEach((w, i) => {
      if (w.status !== 'out') return;
      wanderer(ctx, w, lv.ticks, reducedMotion);
      if (i === s.cursor) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x * CELL - 3, (w.y - 1) * CELL - 3, CELL + 6, CELL * 2 + 4);
      }
    });
    // The skill bar.
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, MAP_H, W, BAR);
    const bw = W / (SKILLS.length + 1);
    SKILLS.forEach((k, i) => {
      const x = i * bw;
      ctx.fillStyle = k === s.skill ? '#1d4ed8' : '#1e293b';
      ctx.fillRect(x + 2, MAP_H + 3, bw - 4, BAR - 6);
      ctx.fillStyle = lv.skills[k] > 0 ? '#e2e8f0' : '#475569';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ICON[k], x + bw / 2 - 7, MAP_H + 19);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${lv.skills[k]}`, x + bw / 2 + 8, MAP_H + 19);
    });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    const left = Math.max(0, Math.ceil(((LIMIT - lv.ticks) * TICK) / 60));
    ctx.fillText(
      `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`,
      W - bw / 2,
      MAP_H + 19,
    );
    ctx.textAlign = 'start';
    if (s.pause && s.won !== null) {
      ctx.fillStyle = 'rgba(15,23,42,0.7)';
      ctx.fillRect(0, MAP_H / 2 - 16, W, 32);
      ctx.fillStyle = s.won ? '#86efac' : '#fca5a5';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${lv.saved} / ${def.walkers}`, W / 2, MAP_H / 2 + 4);
      ctx.textAlign = 'start';
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      if (pointer.y >= MAP_H) {
        const k = Math.floor(pointer.x / (W / (SKILLS.length + 1)));
        return k < SKILLS.length ? `pick-${SKILLS[k]!}` : 'idle';
      }
      // A tap hands the chosen skill to the nearest wanderer.
      let best = -1;
      let bd = 10;
      s.level.walkers.forEach((w, i) => {
        if (w.status !== 'out') return;
        const d = Math.hypot(w.x * CELL + 2 - pointer.x, w.y * CELL - pointer.y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best >= 0 ? `give-${s.skill}-${best}` : 'idle';
    }
    if (held.has('fire')) return 'assign';
    if (held.has('alt')) return 'end';
    if (held.has('left')) return 'prev';
    if (held.has('right')) return 'next';
    if (held.has('up')) return 'up';
    if (held.has('down')) return 'down';
    return 'idle';
  },
  touch: ['left', 'right', 'alt'],
  pointer: true,
  policies: { planner: plannerPolicy, idle: idlePolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    skill: [{ wave: 'square', freq: 660, duration: 0.05, gain: 0.05 }],
    saved: [{ wave: 'triangle', freq: 784, freqEnd: 1047, duration: 0.12, gain: 0.08 }],
    lost: [{ wave: 'sawtooth', freq: 300, freqEnd: 120, duration: 0.25, gain: 0.06 }],
    win: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.12 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.12 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.24, gain: 0.14 },
    ],
    fail: [{ wave: 'sawtooth', freq: 220, freqEnd: 80, duration: 0.6, gain: 0.1 }],
    victory: [
      { wave: 'triangle', freq: 523, duration: 0.15, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.15, delay: 0.15, gain: 0.14 },
      { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.16 },
    ],
  },
  result: (s, o) => ({
    outcome: s.victory ? 'win' : 'loss',
    score: s.score,
    mode: `start:${o.start ?? '1'}`,
  }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('win')) {
      unlock('first');
      if (s.level.saved === LEVELS[s.level.index]!.walkers) unlock('everyone');
    }
    if (s.cleared >= 3) unlock('half');
    if (s.victory) unlock('all');
  },
  ending: (s) =>
    s.victory
      ? ['end.victory', { n: s.totalSaved }]
      : ['end.over', { l: s.level.index + 1, n: s.totalSaved }],
  validate: (d: unknown): d is Rescue => isRescue(d),
  strings: {
    en: {
      title: 'Wanderer Rescue',
      'menu.subtitle':
        'The wanderers walk on their own. Hand out skills — dig, bash, build, block, climb, float — to bring enough of them home.',
      'menu.start': 'Start at level',
      ...Object.fromEntries(LEVELS.map((l, i) => [`start.${i + 1}`, `${i + 1}. ${l.name.en}`])),
      'hud.level': 'Level',
      'hud.saved': 'Home',
      'hud.lives': 'Tries',
      'control.left': 'Previous skill',
      'control.right': 'Next skill',
      'control.alt': 'End level',
      'end.victory': 'All six levels done! {n} wanderers brought home.',
      'end.over': 'Out of tries on level {l} — {n} wanderers brought home.',
    },
    es: {
      title: 'Rescate de caminantes',
      'menu.subtitle':
        'Los caminantes andan solos. Reparte habilidades —cavar, perforar, construir, bloquear, trepar, flotar— para llevar a casa a suficientes.',
      'menu.start': 'Empezar en el nivel',
      ...Object.fromEntries(LEVELS.map((l, i) => [`start.${i + 1}`, `${i + 1}. ${l.name.es}`])),
      'hud.level': 'Nivel',
      'hud.saved': 'En casa',
      'hud.lives': 'Intentos',
      'control.left': 'Habilidad anterior',
      'control.right': 'Habilidad siguiente',
      'control.alt': 'Terminar nivel',
      'end.victory': '¡Los seis niveles superados! {n} caminantes en casa.',
      'end.over': 'Sin intentos en el nivel {l}: {n} caminantes en casa.',
    },
  },
};
