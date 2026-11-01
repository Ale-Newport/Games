/** Snake for the shared arcade shell, per rule set: drawing, controls, sounds, results and strings. */
import type { Dictionary, Locale } from '../../../core/i18n';
import type { ArcadeDef } from '../arcade/types';
import {
  ACTIONS,
  N,
  greedyPolicy,
  isSnake,
  newSnake,
  pathfinderPolicy,
  stepSnake,
  type Snake,
  type SnakeAction,
  type SnakeRules,
} from './sim';

const CELL = 18;
const SIZE = N * CELL;

export function snakeDef(
  rules: SnakeRules,
  meta: {
    prefix: string;
    strings: Record<Locale, Dictionary>;
    achievements: (s: Snake, unlock: (id: string) => void) => void;
  },
): ArcadeDef<Snake, SnakeAction> {
  return {
    id: rules.id,
    prefix: meta.prefix,
    hz: 60,
    width: SIZE,
    height: SIZE,
    actions: ACTIONS,
    idle: 'idle',
    // The wraparound game adds a one-minute sprint.
    options: rules.wrap
      ? [{ id: 'run', label: 'menu.run', values: ['endless', 'sprint'], initial: 'endless' }]
      : [],
    init: (seed, o) => newSnake(rules, seed, o.run === 'sprint' ? 60 * 60 : null),
    step: (s, a) => stepSnake(rules, s, a),
    over: (s) => s.over,
    score: (s) => s.score,
    hud: (s) => [
      ['hud.score', s.score],
      ['hud.length', s.body.length],
      ...(s.clock !== null ? [['hud.time', Math.ceil(s.clock / 60)] as [string, number]] : []),
    ],
    draw(ctx, s) {
      ctx.fillStyle = '#0d1a12';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < N * N; i++)
        if ((i % N) % 2 === Math.floor(i / N) % 2)
          ctx.fillRect((i % N) * CELL, Math.floor(i / N) * CELL, CELL, CELL);
      if (!rules.wrap) {
        ctx.strokeStyle = '#e5484d';
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);
      }
      const at = (c: number) => [(c % N) * CELL, Math.floor(c / N) * CELL] as const;
      ctx.fillStyle = '#6b7280';
      for (const b of s.blocks) {
        const [x, y] = at(b);
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = '#374151';
        ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
      }
      if (s.apple >= 0) {
        const [x, y] = at(s.apple);
        ctx.fillStyle = '#e5484d';
        ctx.beginPath();
        ctx.arc(x + CELL / 2, y + CELL / 2 + 1, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#30a46c';
        ctx.fillRect(x + CELL / 2, y + 2, 4, 3);
      }
      if (s.bonus) {
        const [x, y] = at(s.bonus.cell);
        ctx.fillStyle =
          s.bonus.left < 90 && s.bonus.left % 20 < 10 ? 'rgba(241,196,15,0.4)' : '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(x + CELL / 2, y + 2);
        ctx.lineTo(x + CELL - 2, y + CELL / 2);
        ctx.lineTo(x + CELL / 2, y + CELL - 2);
        ctx.lineTo(x + 2, y + CELL / 2);
        ctx.closePath();
        ctx.fill();
      }
      s.body.forEach((c, i) => {
        const [x, y] = at(c);
        const t = i / Math.max(1, s.body.length - 1);
        ctx.fillStyle =
          i === 0
            ? '#a7f3d0'
            : `rgb(${Math.round(48 + 20 * t)}, ${Math.round(164 - 60 * t)}, ${Math.round(108 - 30 * t)})`;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      });
      // Eyes on the head, facing the way it moves.
      const [hx, hy] = at(s.body[0]!);
      ctx.fillStyle = '#0d1a12';
      const e = {
        up: [
          [5, 5],
          [11, 5],
        ],
        down: [
          [5, 11],
          [11, 11],
        ],
        left: [
          [5, 5],
          [5, 11],
        ],
        right: [
          [11, 5],
          [11, 11],
        ],
      }[s.dir];
      for (const [ex, ey] of e) ctx.fillRect(hx + ex!, hy + ey!, 2.5, 2.5);
    },
    control(_s, held) {
      for (const d of ['up', 'down', 'left', 'right'] as const) if (held.has(d)) return d;
      return 'idle';
    },
    touch: ['left', 'up', 'down', 'right'],
    pointer: false,
    policies: {
      pathfinder: (s) => pathfinderPolicy(rules, s),
      greedy: (s) => greedyPolicy(rules, s),
    },
    sounds: (_p, next) => next.events,
    soundBank: {
      eat: [{ wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.07, gain: 0.1 }],
      bonus: [
        { wave: 'triangle', freq: 880, duration: 0.06, gain: 0.12 },
        { wave: 'triangle', freq: 1320, duration: 0.12, delay: 0.06, gain: 0.12 },
      ],
      'bonus-appears': [{ wave: 'sine', freq: 1200, duration: 0.08, gain: 0.06 }],
      block: [{ wave: 'square', freq: 160, duration: 0.08, gain: 0.06 }],
      crash: [{ wave: 'sawtooth', freq: 240, freqEnd: 60, duration: 0.6, gain: 0.1 }],
      time: [{ wave: 'triangle', freq: 784, duration: 0.3, gain: 0.14 }],
      full: [
        { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
        { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.12, gain: 0.2 },
      ],
    },
    result: (s) => ({
      outcome: 'complete',
      score: s.score,
      mode: s.clock !== null ? `${rules.id}-sprint` : rules.id,
    }),
    achievements: (s, _o, unlock) => meta.achievements(s, unlock),
    ending: (s) => [
      s.events.includes('full') ? 'end.full' : s.events.includes('time') ? 'end.time' : 'end.crash',
      { n: s.score, l: s.body.length },
    ],
    validate: (d: unknown): d is Snake => isSnake(d, rules),
    strings: meta.strings,
  };
}
