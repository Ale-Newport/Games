/** Brick breaking for the shared arcade shell: drawing, controls, sounds and results, per rule set. */
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { ArcadeDef } from '../arcade/types';
import {
  ACTIONS,
  BALL,
  BRICK_H,
  BRICK_W,
  H,
  PADDLE_H,
  PADDLE_Y,
  W,
  followerPolicy,
  isBricks,
  newBricks,
  plannerPolicy,
  stepBricks,
  type BrickAction,
  type BrickRules,
  type Bricks,
  type CapsuleKind,
} from './sim';

/** Row colours, top first (the classic bands), and colours by hits left for the enhanced bricks. */
const ROW_COLOURS = [
  '#e5484d',
  '#e5484d',
  '#f08c3a',
  '#f08c3a',
  '#30a46c',
  '#30a46c',
  '#f1c40f',
  '#f1c40f',
];
const HIT_COLOURS: Record<number, string> = { 1: '#5aa9e6', 2: '#7c5cff', 3: '#b03a8c' };
const CAPSULE_COLOURS: Record<CapsuleKind, string> = {
  wide: '#30a46c',
  multi: '#5aa9e6',
  slow: '#f1c40f',
  laser: '#e5484d',
  life: '#ff8fb1',
};
const CAPSULE_LETTER: Record<CapsuleKind, string> = {
  wide: 'W',
  multi: 'M',
  slow: 'S',
  laser: 'L',
  life: '+',
};

const SOUNDS: Record<string, SoundSpec> = {
  paddle: [{ wave: 'square', freq: 440, duration: 0.04, gain: 0.07 }],
  wall: [{ wave: 'square', freq: 300, duration: 0.03, gain: 0.05 }],
  brick: [{ wave: 'triangle', freq: 780, duration: 0.05, gain: 0.08 }],
  dent: [{ wave: 'square', freq: 220, duration: 0.05, gain: 0.07 }],
  gold: [{ wave: 'square', freq: 160, duration: 0.06, gain: 0.06 }],
  laser: [{ wave: 'sawtooth', freq: 1200, freqEnd: 600, duration: 0.08, gain: 0.05 }],
  capsule: [
    { wave: 'triangle', freq: 660, duration: 0.06, gain: 0.1 },
    { wave: 'triangle', freq: 990, duration: 0.1, delay: 0.06, gain: 0.1 },
  ],
  lost: [{ wave: 'sawtooth', freq: 260, freqEnd: 90, duration: 0.45, gain: 0.08 }],
  cleared: [
    { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.15 },
    { wave: 'triangle', freq: 784, duration: 0.18, delay: 0.09, gain: 0.15 },
  ],
  end: [
    { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
    { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
  ],
};

export function bricksDef(
  rules: BrickRules,
  meta: {
    id: string;
    prefix: string;
    strings: Record<Locale, Dictionary>;
    achievements: (s: Bricks, unlock: (id: string) => void) => void;
  },
): ArcadeDef<Bricks, BrickAction> {
  return {
    id: meta.id,
    prefix: meta.prefix,
    hz: 60,
    width: W,
    height: H,
    actions: ACTIONS,
    idle: 'idle',
    options: [],
    init: (seed) => newBricks(rules, seed),
    step: (s, a) => stepBricks(rules, s, a),
    over: (s) => s.over,
    score: (s) => s.score,
    hud: (s) => [
      ['hud.score', s.score],
      ['hud.lives', s.lives],
      ['hud.wall', `${s.wall + 1}/${rules.walls.length}`],
    ],
    draw(ctx, s, { reducedMotion }) {
      ctx.fillStyle = '#0b0e17';
      ctx.fillRect(0, 0, W, H);
      for (const b of s.bricks) {
        ctx.fillStyle = b.gold
          ? '#c9a227'
          : rules.capsules
            ? HIT_COLOURS[b.hits]!
            : ROW_COLOURS[b.row % ROW_COLOURS.length]!;
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(b.x, b.y, BRICK_W, 3);
        // Hits left, written on the brick (not only its colour).
        if (rules.capsules && !b.gold && b.hits > 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(b.hits), b.x + BRICK_W / 2, b.y + BRICK_H - 3);
        }
      }
      for (const c of s.capsules) {
        ctx.fillStyle = CAPSULE_COLOURS[c.kind];
        ctx.beginPath();
        ctx.roundRect(c.x - 12, c.y - 6, 24, 12, 6);
        ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(CAPSULE_LETTER[c.kind], c.x, c.y + 4);
      }
      ctx.fillStyle = '#e5484d';
      for (const p of s.shots) ctx.fillRect(p.x - 1, p.y - 6, 2, 8);
      ctx.fillStyle = s.timers.laser > 0 ? '#e5484d' : '#7c5cff';
      ctx.beginPath();
      ctx.roundRect(s.paddle - s.paddleW / 2, PADDLE_Y, s.paddleW, PADDLE_H, 4);
      ctx.fill();
      const balls = s.held !== null ? [{ x: s.paddle, y: PADDLE_Y - BALL, vx: 0, vy: 0 }] : s.balls;
      for (const b of balls) {
        if (!reducedMotion && (b.vx || b.vy)) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.arc(b.x - b.vx * 1.6, b.y - b.vy * 1.6, BALL / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    control(s, held, pointer) {
      const fire = held.has('fire') || held.has('up');
      const dir = pointer
        ? pointer.x < s.paddle - 4
          ? -1
          : pointer.x > s.paddle + 4
            ? 1
            : 0
        : held.has('left') && !held.has('right')
          ? -1
          : held.has('right') && !held.has('left')
            ? 1
            : 0;
      if (dir < 0) return fire ? 'left-fire' : 'left';
      if (dir > 0) return fire ? 'right-fire' : 'right';
      return fire || (pointer !== null && s.held !== null) ? 'fire' : 'idle';
    },
    touch: rules.capsules ? ['left', 'fire', 'right'] : ['left', 'fire', 'right'],
    pointer: true,
    policies: { planner: plannerPolicy, follower: followerPolicy },
    sounds(_prev, next) {
      const out: string[] = [];
      for (const e of next.events) {
        if (e.startsWith('capsule-')) out.push('capsule');
        else if (e === 'wall-cleared') out.push('cleared');
        else if (e !== 'launch' && e !== 'shrink') out.push(e);
      }
      if (next.over && !next.cleared) out.push('end');
      return [...new Set(out)];
    },
    soundBank: SOUNDS,
    result: (s) => ({
      outcome: s.over && s.lives > 0 ? 'complete' : 'fail',
      score: s.score,
      mode: rules.id,
    }),
    achievements: (s, _options, unlock) => meta.achievements(s, unlock),
    ending: (s) => [s.lives > 0 ? 'end.cleared' : 'end.over', { n: s.score, w: s.wall + 1 }],
    validate: (d: unknown): d is Bricks => isBricks(d, rules),
    strings: meta.strings,
  };
}
