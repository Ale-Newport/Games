/** Maze chase for the shared arcade shell, per rule set: drawing, controls, sounds, results and strings. */
import type { Dictionary, Locale } from '../../../core/i18n';
import type { ArcadeDef } from '../arcade/types';
import { COLS, ROWS } from './layout';
import {
  ACTIONS,
  SUB,
  grazerPolicy,
  isMazeGame,
  newMazeGame,
  runnerPolicy,
  stepMaze,
  type MazeAction,
  type MazeGame,
  type MazeRules,
} from './sim';

const CELL = 16;
const W = COLS * CELL;
const H = ROWS * CELL;
const SCALE = CELL / SUB;
const CHASER_COLOURS = ['#f43f5e', '#a855f7', '#84cc16', '#f59e0b'];
const FRUIT_COLOURS = [
  '#f472b6',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#818cf8',
  '#e879f9',
  '#f8fafc',
];

export function mazeDef(
  rules: MazeRules,
  meta: {
    prefix: string;
    strings: Record<Locale, Dictionary>;
    achievements: (s: MazeGame, unlock: (id: string) => void) => void;
  },
): ArcadeDef<MazeGame, MazeAction> {
  return {
    id: rules.id,
    prefix: meta.prefix,
    hz: 60,
    width: W,
    height: H,
    actions: ACTIONS,
    idle: 'idle',
    options: [],
    init: (seed) => newMazeGame(rules, seed),
    step: (s, a) => stepMaze(rules, s, a),
    over: (s) => s.over,
    score: (s) => s.score,
    hud: (s) => [
      ['hud.score', s.score],
      ['hud.lives', s.lives],
      ['hud.level', s.level],
    ],
    draw(ctx, s, { reducedMotion }) {
      const m = s.maze;
      ctx.fillStyle = '#05080f';
      ctx.fillRect(0, 0, W, H);
      // Walls: dark blocks with a bright edge wherever they meet a corridor (it flashes as a level clears).
      const flash = s.clearing > 0 && !reducedMotion && Math.floor(s.clearing / 15) % 2 === 0;
      const isWall = (x: number, y: number) =>
        x < 0 || y < 0 || x >= COLS || y >= ROWS ? false : m.tiles[y * COLS + x] === 'wall';
      ctx.lineWidth = 2;
      ctx.strokeStyle = flash ? '#f8fafc' : '#2dd4bf';
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const t = m.tiles[y * COLS + x];
          if (t === 'door') {
            ctx.fillStyle = '#fda4af';
            ctx.fillRect(x * CELL, y * CELL + CELL / 2 - 1, CELL, 3);
            continue;
          }
          if (t !== 'wall') continue;
          ctx.fillStyle = '#0f2a2e';
          ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          ctx.beginPath();
          if (!isWall(x, y - 1) && y > 0) {
            ctx.moveTo(x * CELL, y * CELL + 1);
            ctx.lineTo(x * CELL + CELL, y * CELL + 1);
          }
          if (!isWall(x, y + 1) && y < ROWS - 1) {
            ctx.moveTo(x * CELL, y * CELL + CELL - 1);
            ctx.lineTo(x * CELL + CELL, y * CELL + CELL - 1);
          }
          if (!isWall(x - 1, y) && x > 0) {
            ctx.moveTo(x * CELL + 1, y * CELL);
            ctx.lineTo(x * CELL + 1, y * CELL + CELL);
          }
          if (!isWall(x + 1, y) && x < COLS - 1) {
            ctx.moveTo(x * CELL + CELL - 1, y * CELL);
            ctx.lineTo(x * CELL + CELL - 1, y * CELL + CELL);
          }
          ctx.stroke();
        }
      // Seeds (small squares) and power cells (pulsing rings).
      const pulse = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(s.steps / 6);
      s.dots.forEach((on, i) => {
        if (!on) return;
        const cx = (i % COLS) * CELL + CELL / 2;
        const cy = Math.floor(i / COLS) * CELL + CELL / 2;
        if (m.pellets.includes(i)) {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 5 * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
        } else {
          ctx.fillStyle = '#fde68a';
          ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
        }
      });
      const px = (v: number) => v * SCALE;
      // The bonus gem.
      if (s.fruit) {
        const cx = px(s.fruit.x);
        const cy = px(s.fruit.y);
        ctx.fillStyle = FRUIT_COLOURS[Math.min(s.level - 1, FRUIT_COLOURS.length - 1)]!;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k + Math.PI / 6;
          ctx.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(cx - 2, cy - 3, 2, 2);
      }
      // The sentinels: diamonds with one eye looking where they go.
      const look = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
      s.chasers.forEach((c, i) => {
        const cx = px(c.x);
        const cy = px(c.y);
        if (c.mode !== 'eyes') {
          const blink =
            c.mode === 'frightened' && s.fright < 90 && Math.floor(s.fright / 10) % 2 === 0;
          ctx.fillStyle =
            c.mode === 'frightened' ? (blink ? '#e2e8f0' : '#1d4ed8') : CHASER_COLOURS[i]!;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 7);
          ctx.lineTo(cx + 7, cy);
          ctx.lineTo(cx, cy + 7);
          ctx.lineTo(cx - 7, cy);
          ctx.closePath();
          ctx.fill();
        }
        const [lx, ly] = look[c.dir];
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.mode === 'frightened' ? '#1d4ed8' : '#0f172a';
        ctx.fillRect(cx + lx * 1.5 - 1, cy + ly * 1.5 - 1, 2, 2);
      });
      // The rover: a rounded square with a visor facing its way; it shrinks away when caught.
      const p = s.player;
      const shrink = s.dying > 0 ? s.dying / 100 : 1;
      const r = 6 * shrink;
      const cx = px(p.x);
      const cy = px(p.y);
      if (r > 0.5) {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.45);
        ctx.fill();
        const [vx, vy] = look[p.dir];
        ctx.fillStyle = '#083344';
        if (vx !== 0) ctx.fillRect(cx + vx * r * 0.35 - r * 0.2, cy - r * 0.55, r * 0.4, r * 1.1);
        else ctx.fillRect(cx - r * 0.55, cy + vy * r * 0.35 - r * 0.2, r * 1.1, r * 0.4);
      }
    },
    control(_s, held) {
      for (const d of ['up', 'down', 'left', 'right'] as const) if (held.has(d)) return d;
      return 'idle';
    },
    touch: ['left', 'up', 'down', 'right'],
    pointer: false,
    policies: { runner: runnerPolicy, grazer: grazerPolicy },
    sounds: (_p, next) => next.events,
    soundBank: {
      dot: [{ wave: 'square', freq: 520, duration: 0.03, gain: 0.03 }],
      pellet: [{ wave: 'triangle', freq: 300, freqEnd: 900, duration: 0.2, gain: 0.1 }],
      'chaser-eaten': [{ wave: 'triangle', freq: 1200, freqEnd: 400, duration: 0.25, gain: 0.12 }],
      fruit: [{ wave: 'sine', freq: 1000, duration: 0.08, gain: 0.06 }],
      'fruit-eaten': [
        { wave: 'triangle', freq: 880, duration: 0.06, gain: 0.12 },
        { wave: 'triangle', freq: 1320, duration: 0.12, delay: 0.06, gain: 0.12 },
      ],
      caught: [{ wave: 'sawtooth', freq: 500, freqEnd: 60, duration: 0.9, gain: 0.1 }],
      extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
      cleared: [
        { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
        { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.12, gain: 0.16 },
        { wave: 'triangle', freq: 1047, duration: 0.3, delay: 0.24, gain: 0.18 },
      ],
    },
    result: (s) => ({ outcome: 'complete', score: s.score, mode: rules.id }),
    achievements: (s, _o, unlock) => meta.achievements(s, unlock),
    ending: (s) => ['end.over', { n: s.score, l: s.level }],
    validate: (d: unknown): d is MazeGame => isMazeGame(d, rules),
    strings: meta.strings,
  };
}
