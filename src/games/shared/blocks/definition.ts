/** Falling blocks for the shared arcade shell, per rule set: drawing, controls, sounds, results. */
import type { Dictionary, Locale } from '../../../core/i18n';
import type { ArcadeDef, ArcadeOption } from '../arcade/types';
import { dropperAction, plannerAction } from './ai';
import { cells, type Kind } from './pieces';
import {
  actionsFor,
  COLS,
  dropY,
  HIDDEN,
  isBlocks,
  newBlocks,
  ROWS,
  stepBlocks,
  type BlockRules,
  type Blocks,
} from './sim';

const CELL = 18;
const BOARD_X = 8;
const BOARD_Y = 8;
const WIDTH = 300;
const HEIGHT = BOARD_Y * 2 + (ROWS - HIDDEN) * CELL;

/** Piece colours, with a pattern letter for colour-blind play. */
const COLOURS: Record<Kind, string> = {
  I: '#4dd0e1',
  O: '#f1c40f',
  T: '#b15cff',
  S: '#30a46c',
  Z: '#e5484d',
  J: '#3e63dd',
  L: '#f08c3a',
};

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  kind: Kind,
  ghost = false,
) {
  if (ghost) {
    ctx.strokeStyle = COLOURS[kind];
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = COLOURS[kind];
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x + 1, y + 1, size - 2, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x + 1, y + size - 4, size - 2, 3);
}

function mini(ctx: CanvasRenderingContext2D, kind: Kind, x: number, y: number) {
  const s = 11;
  for (const [cx, cy] of cells(kind, 0)) block(ctx, x + cx * s, y + cy * s, s, kind);
}

export function blocksDef(
  rules: BlockRules,
  meta: {
    prefix: string;
    options: ArcadeOption[];
    strings: Record<Locale, Dictionary>;
    achievements: (s: Blocks, unlock: (id: string) => void) => void;
  },
): ArcadeDef<Blocks, string> {
  const init = (seed: number, o: Record<string, string>) =>
    rules.modern
      ? newBlocks(rules, seed, { goal: o.mode === 'sprint' ? 40 : 150 })
      : newBlocks(rules, seed, { startLevel: Number(o.start ?? 0) });
  return {
    id: rules.id,
    prefix: meta.prefix,
    hz: 60,
    width: WIDTH,
    height: HEIGHT,
    actions: actionsFor(rules.modern),
    idle: 'idle',
    options: meta.options,
    init,
    step: (s, a) => stepBlocks(rules, s, a),
    over: (s) => s.over,
    score: (s) => s.score,
    hud: (s) => [
      ['hud.score', s.score],
      ['hud.lines', s.goal ? `${s.lines}/${s.goal}` : s.lines],
      ['hud.level', s.level],
      ...(rules.modern && s.goal === 40
        ? [['hud.time', (s.steps / 60).toFixed(1)] as [string, string]]
        : []),
    ],
    draw(ctx, s, { reducedMotion }) {
      ctx.fillStyle = '#0b0e17';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#121726';
      ctx.fillRect(BOARD_X, BOARD_Y, COLS * CELL, (ROWS - HIDDEN) * CELL);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_X + x * CELL, BOARD_Y);
        ctx.lineTo(BOARD_X + x * CELL, BOARD_Y + (ROWS - HIDDEN) * CELL);
        ctx.stroke();
      }
      const at = (x: number, y: number) =>
        [BOARD_X + x * CELL, BOARD_Y + (y - HIDDEN) * CELL] as const;
      const flash = s.clearing.length && !reducedMotion && Math.floor(s.steps / 4) % 2 === 0;
      for (let y = HIDDEN; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const k = s.board[y * COLS + x];
          if (!k) continue;
          const [px, py] = at(x, y);
          if (s.clearing.includes(y)) {
            ctx.fillStyle = flash ? '#ffffff' : 'rgba(255,255,255,0.6)';
            ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          } else block(ctx, px, py, CELL, k);
        }
      if (s.piece) {
        const p = s.piece;
        if (rules.modern) {
          const gy = dropY(s.board, p);
          for (const [cx, cy] of cells(p.kind, p.r))
            if (gy + cy >= HIDDEN) block(ctx, ...at(p.x + cx, gy + cy), CELL, p.kind, true);
        }
        for (const [cx, cy] of cells(p.kind, p.r))
          if (p.y + cy >= HIDDEN) block(ctx, ...at(p.x + cx, p.y + cy), CELL, p.kind);
      }
      // Side panel: next pieces and the hold box.
      const sx = BOARD_X + COLS * CELL + 14;
      ctx.textAlign = 'left';
      const shown = rules.modern ? s.queue.slice(0, 5) : s.queue.slice(0, 1);
      shown.forEach((k, i) => mini(ctx, k, sx, 14 + i * 40));
      if (rules.modern) {
        ctx.strokeStyle = s.holdUsed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)';
        ctx.strokeRect(sx - 4, 230, 56, 40);
        if (s.hold) mini(ctx, s.hold, sx + 2, 238);
      }
      if (s.last && s.last.points > 0) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 12px system-ui, sans-serif';
        const label = s.last.tspin
          ? `T-spin ${s.last.lines || ''}`
          : s.last.lines === 4
            ? '4!'
            : '';
        if (label) ctx.fillText(label + (s.last.b2b ? ' B2B' : ''), sx - 4, 300);
        if (s.combo > 0) ctx.fillText(`${s.combo}× combo`, sx - 4, 318);
      }
    },
    control(_s, held) {
      let a = '';
      if (held.has('left') && !held.has('right')) a += 'L';
      else if (held.has('right') && !held.has('left')) a += 'R';
      if (held.has('up')) a += 'C';
      else if (held.has('ccw') || held.has('alt')) a += 'A';
      if (held.has('down')) a += 'S';
      else if (rules.modern && held.has('fire')) a += 'H';
      if (rules.modern && held.has('hold')) a += 'K';
      return a || 'idle';
    },
    touch: rules.modern
      ? ['left', 'right', 'down', 'fire', 'ccw', 'up', 'hold']
      : ['left', 'right', 'down', 'ccw', 'up'],
    pointer: false,
    policies: { planner: (s) => plannerAction(rules, s), dropper: (s) => dropperAction(rules, s) },
    sounds: (_p, next) => next.events.filter((e) => e !== 'move' || next.steps % 2 === 0),
    soundBank: {
      move: [{ wave: 'square', freq: 220, duration: 0.02, gain: 0.03 }],
      rotate: [{ wave: 'triangle', freq: 520, duration: 0.03, gain: 0.05 }],
      drop: [{ wave: 'noise', freq: 0, duration: 0.05, gain: 0.07, lowpass: 1200 }],
      lock: [{ wave: 'square', freq: 140, duration: 0.03, gain: 0.05 }],
      hold: [{ wave: 'sine', freq: 660, duration: 0.05, gain: 0.06 }],
      clear: [{ wave: 'triangle', freq: 660, freqEnd: 990, duration: 0.15, gain: 0.1 }],
      four: [
        { wave: 'triangle', freq: 523, duration: 0.08, gain: 0.14 },
        { wave: 'triangle', freq: 784, duration: 0.08, delay: 0.08, gain: 0.14 },
        { wave: 'triangle', freq: 1047, duration: 0.2, delay: 0.16, gain: 0.14 },
      ],
      tspin: [{ wave: 'sine', freq: 880, freqEnd: 1320, duration: 0.2, gain: 0.1 }],
      level: [{ wave: 'triangle', freq: 990, duration: 0.2, gain: 0.12 }],
      goal: [
        { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
        { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.12, gain: 0.2 },
      ],
      topout: [
        { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
        { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
      ],
    },
    result: (s, o) =>
      s.goal === 40
        ? {
            outcome: s.won ? 'complete' : 'fail',
            timeMs: s.won ? Math.round((s.steps / 60) * 1000) : undefined,
            score: s.score,
            mode: 'sprint',
          }
        : {
            outcome: 'complete',
            score: s.score,
            mode: rules.modern ? 'marathon' : `start-${o.start ?? 0}`,
          },
    achievements: (s, _o, unlock) => meta.achievements(s, unlock),
    ending: (s) => [
      s.won ? (s.goal === 40 ? 'end.sprint' : 'end.goal') : 'end.topout',
      { n: s.score, l: s.lines, t: (s.steps / 60).toFixed(1) },
    ],
    validate: (d: unknown): d is Blocks => isBlocks(d, rules),
    strings: meta.strings,
  };
}
