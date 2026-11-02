/** Crossing for the shared arcade shell, per rule set: drawing, controls, sounds, results and strings. */
import type { Dictionary, Locale } from '../../../core/i18n';
import type { ArcadeDef } from '../arcade/types';
import {
  ACTIONS,
  BAYS,
  CLASSIC_ROWS,
  COLS,
  SUB,
  VIEW,
  hopperPolicy,
  isCrossing,
  itemX,
  lookaheadPolicy,
  newCrossing,
  stepCrossing,
  submerged,
  trainDue,
  type CrossAction,
  type CrossRules,
  type Crossing,
  type Lane,
} from './sim';

const CELL = 24;
const PX = CELL / SUB;
const WIDTH = COLS * CELL;
const BAR = 10;
const CAR_COLOURS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#e879f9'];
const HOP_STEPS = 6;

function drawLane(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  y: number,
  s: Crossing,
  reducedMotion: boolean,
) {
  const t = s.steps;
  switch (lane.kind) {
    case 'safe':
      ctx.fillStyle = '#3b3552';
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let c = 0; c < COLS; c++) ctx.fillRect(c * CELL + 4, y + 4, CELL - 8, CELL - 8);
      break;
    case 'grass':
      ctx.fillStyle = lane.tint ? '#2f6b2f' : '#357535';
      ctx.fillRect(0, y, WIDTH, CELL);
      for (const c of lane.trees ?? []) {
        ctx.fillStyle = '#5b3a1e';
        ctx.fillRect(c * CELL + 10, y + 14, 4, 8);
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(c * CELL + 12, y + 11, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'road':
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 4; x < WIDTH; x += 24) ctx.fillRect(x, y + CELL - 2, 12, 2);
      break;
    case 'river':
      ctx.fillStyle = '#0e3a5c';
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.strokeStyle = 'rgba(147,197,253,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < WIDTH; x += 16) {
        const o = reducedMotion ? 0 : Math.sin((x + t) / 9) * 2;
        ctx.moveTo(x, y + 12 + o);
        ctx.lineTo(x + 6, y + 10 + o);
      }
      ctx.stroke();
      break;
    case 'rail': {
      ctx.fillStyle = '#3f3a36';
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.fillStyle = '#6b5a45';
      for (let x = 2; x < WIDTH; x += 10) ctx.fillRect(x, y + 4, 4, CELL - 8);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(0, y + 7, WIDTH, 2);
      ctx.fillRect(0, y + 15, WIDTH, 2);
      const due = trainDue(lane, t);
      const warn = due <= 75;
      const on = warn && (reducedMotion || Math.floor(t / 8) % 2 === 0);
      ctx.fillStyle = '#111827';
      ctx.fillRect(2, y + 2, 8, 20);
      ctx.fillStyle = on ? '#ef4444' : '#450a0a';
      ctx.beginPath();
      ctx.arc(6, y + 7, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'goal':
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.fillStyle = '#166534';
      for (let x = 0; x < WIDTH; x += 8) ctx.fillRect(x, y + (x % 16 ? 2 : 0), 6, 6);
      BAYS.forEach((c, i) => {
        ctx.fillStyle = '#0c2a3e';
        ctx.fillRect(c * CELL + 1, y + 4, CELL - 2, CELL - 4);
        if (s.filled[i]) hedgehog(ctx, c * CELL + CELL / 2, y + CELL / 2 + 2, 'up', 0.8, true);
        else if (s.beetle?.bay === i) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(c * CELL + CELL / 2, y + CELL / 2 + 2, 5, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#713f12';
          ctx.fillRect(c * CELL + CELL / 2 - 0.5, y + CELL / 2 - 4, 1, 12);
        }
      });
      break;
  }
  // Moving things.
  for (const it of lane.items) {
    const x = itemX(lane, it, t) * PX;
    const len = it.len * PX;
    if (x > WIDTH || x + len < 0) continue;
    if (it.kind === 'log') {
      ctx.fillStyle = '#7c4a21';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 3, len - 2, CELL - 6, 8);
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1;
      for (let k = x + 10; k < x + len - 6; k += 18) {
        ctx.beginPath();
        ctx.moveTo(k, y + 6);
        ctx.lineTo(k + 6, y + 6);
        ctx.stroke();
      }
    } else if (it.kind === 'turtle') {
      const { under, soon } = submerged(lane, it, t);
      if (under) continue;
      const fade = soon && (reducedMotion || Math.floor(t / 6) % 2 === 0);
      for (let k = 0; k < it.len / SUB; k++) {
        const cx = x + k * CELL + CELL / 2;
        ctx.fillStyle = fade ? 'rgba(34,197,94,0.35)' : '#15803d';
        ctx.beginPath();
        ctx.ellipse(cx, y + CELL / 2, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = fade ? 'rgba(134,239,172,0.35)' : '#4ade80';
        ctx.beginPath();
        ctx.arc(cx + lane.dir * 9, y + CELL / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (it.kind === 'train') {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(x, y + 2, len, CELL - 4);
      ctx.fillStyle = '#fde68a';
      for (let k = x + 8; k < x + len - 8; k += 20) ctx.fillRect(k, y + 6, 10, 6);
    } else {
      const truck = it.kind === 'truck';
      ctx.fillStyle = truck ? '#e5e7eb' : CAR_COLOURS[lane.tint % CAR_COLOURS.length]!;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, len - 4, CELL - 8, 4);
      ctx.fill();
      // The cab or windscreen at the front.
      const front = lane.dir > 0 ? x + len - 10 : x + 4;
      ctx.fillStyle = truck ? '#64748b' : '#bae6fd';
      ctx.fillRect(front, y + 7, 6, CELL - 14);
      ctx.fillStyle = '#0b0f19';
      for (const wx of [x + 5, x + len - 9]) {
        ctx.fillRect(wx, y + 2, 5, 3);
        ctx.fillRect(wx, y + CELL - 5, 5, 3);
      }
    }
  }
}

/** The hedgehog: a round brown body with a fringe of spines and a pale face looking its way. */
function hedgehog(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: string,
  scale: number,
  asleep = false,
) {
  const ang = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[facing] ?? 0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#3f2a16';
  for (let k = -3; k <= 3; k++) {
    const a = Math.PI + k * 0.38;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.2) * 7, Math.sin(a - 0.2) * 7);
    ctx.lineTo(Math.cos(a) * 11.5, Math.sin(a) * 11.5);
    ctx.lineTo(Math.cos(a + 0.2) * 7, Math.sin(a + 0.2) * 7);
    ctx.fill();
  }
  ctx.fillStyle = '#7c5530';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 8, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e7c9a0';
  ctx.beginPath();
  ctx.ellipse(5, 0, 5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(9.5, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (!asleep) {
    ctx.fillRect(5, -3, 1.6, 1.6);
    ctx.fillRect(5, 1.4, 1.6, 1.6);
  }
  ctx.restore();
}

export function crossingDef(
  rules: CrossRules,
  meta: {
    prefix: string;
    strings: Record<Locale, Dictionary>;
    achievements: (s: Crossing, unlock: (id: string) => void) => void;
  },
): ArcadeDef<Crossing, CrossAction> {
  const height = rules.endless ? VIEW * CELL : CLASSIC_ROWS * CELL + BAR;
  return {
    id: rules.id,
    prefix: meta.prefix,
    hz: 60,
    width: WIDTH,
    height,
    actions: ACTIONS,
    idle: 'idle',
    options: [],
    init: (seed) => newCrossing(rules, seed),
    step: (s, a) => stepCrossing(rules, s, a),
    over: (s) => s.over,
    score: (s) => s.score,
    hud: (s) =>
      rules.endless
        ? [['hud.rows', s.score]]
        : [
            ['hud.score', s.score],
            ['hud.lives', s.lives],
            ['hud.level', s.level],
          ],
    draw(ctx, s, { reducedMotion }) {
      ctx.fillStyle = '#05080f';
      ctx.fillRect(0, 0, WIDTH, height);
      // Screen y of a row's top edge.
      const top = (row: number) =>
        rules.endless ? height - (row - s.camera + 1) * CELL : (CLASSIC_ROWS - 1 - row) * CELL;
      const first = rules.endless ? Math.floor(s.camera) - 1 : 0;
      const last = rules.endless ? Math.ceil(s.camera) + VIEW + 1 : CLASSIC_ROWS - 1;
      for (let row = first; row <= last; row++) {
        const lane = s.lanes[row - s.base];
        if (lane) drawLane(ctx, lane, top(row), s, reducedMotion);
      }
      // The hedgehog, mid-hop if hopping (a little larger at the top of the jump).
      let hx = s.x * PX;
      let hy = top(s.y) + CELL / 2;
      let scale = 1;
      if (s.hop) {
        const p = 1 - s.hop.left / HOP_STEPS;
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[s.hop.dir]!;
        hx += d[0]! * CELL * p;
        hy += d[1]! * CELL * p;
        scale = 1 + 0.2 * Math.sin(Math.PI * p);
      }
      if (s.dying > 0) {
        const p = s.dying / 60;
        ctx.globalAlpha = p;
        if (s.cause === 'water' || s.cause === 'edge') {
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hx, hy, 4 + (1 - p) * 10, 0, Math.PI * 2);
          ctx.stroke();
        } else hedgehog(ctx, hx, hy, s.facing, 1.1, true);
        ctx.globalAlpha = 1;
      } else hedgehog(ctx, hx, hy, s.facing, scale);
      if (!rules.endless) {
        // The time left for this crossing.
        const share = s.timer / (30 * 60);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, CLASSIC_ROWS * CELL, WIDTH, BAR);
        ctx.fillStyle = share < 0.25 ? '#ef4444' : '#a3e635';
        ctx.fillRect(2, CLASSIC_ROWS * CELL + 2, (WIDTH - 4) * share, BAR - 4);
      }
    },
    control(_s, held) {
      for (const d of ['up', 'down', 'left', 'right'] as const) if (held.has(d)) return d;
      return 'idle';
    },
    touch: ['left', 'up', 'down', 'right'],
    pointer: false,
    policies: {
      lookahead: (s) => lookaheadPolicy(rules, s),
      hopper: (s) => hopperPolicy(rules, s),
    },
    sounds: (_p, next) => next.events,
    soundBank: {
      hop: [{ wave: 'square', freq: 440, freqEnd: 660, duration: 0.05, gain: 0.04 }],
      road: [{ wave: 'sawtooth', freq: 220, freqEnd: 50, duration: 0.4, gain: 0.1 }],
      train: [{ wave: 'sawtooth', freq: 160, freqEnd: 40, duration: 0.6, gain: 0.12 }],
      water: [{ wave: 'sine', freq: 600, freqEnd: 120, duration: 0.5, gain: 0.1 }],
      edge: [{ wave: 'sine', freq: 600, freqEnd: 120, duration: 0.5, gain: 0.1 }],
      hedge: [{ wave: 'square', freq: 180, duration: 0.25, gain: 0.08 }],
      time: [{ wave: 'triangle', freq: 330, freqEnd: 110, duration: 0.5, gain: 0.1 }],
      hawk: [{ wave: 'sawtooth', freq: 900, freqEnd: 300, duration: 0.5, gain: 0.08 }],
      home: [
        { wave: 'triangle', freq: 660, duration: 0.08, gain: 0.12 },
        { wave: 'triangle', freq: 990, duration: 0.15, delay: 0.08, gain: 0.12 },
      ],
      beetle: [{ wave: 'triangle', freq: 1320, duration: 0.15, gain: 0.12 }],
      extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
      level: [
        { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.16 },
        { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.12, gain: 0.16 },
        { wave: 'triangle', freq: 1047, duration: 0.3, delay: 0.24, gain: 0.18 },
      ],
    },
    result: (s) => ({ outcome: 'complete', score: s.score, mode: rules.id }),
    achievements: (s, _o, unlock) => meta.achievements(s, unlock),
    ending: (s) =>
      rules.endless
        ? [`end.${s.cause ?? 'road'}`, { n: s.score }]
        : ['end.over', { n: s.score, l: s.level }],
    validate: (d: unknown): d is Crossing => isCrossing(d, rules),
    strings: meta.strings,
  };
}
