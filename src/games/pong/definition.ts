/** Pong for the shared arcade shell: options, drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  BALL,
  H,
  LEFT_X,
  PADDLE_H,
  PADDLE_W,
  RIGHT_X,
  W,
  ACTIONS,
  followerPolicy,
  isPong,
  newPong,
  pongOver,
  stepPong,
  trackerPolicy,
  type Pong,
  type PongAction,
} from './sim';

const TARGETS: Record<string, number> = { short: 3, standard: 5, long: 11 };

export const PONG: ArcadeDef<Pong, PongAction> = {
  id: 'pong',
  prefix: 'pg2',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [
    { id: 'level', label: 'menu.level', values: ['easy', 'medium', 'hard'], initial: 'medium' },
    {
      id: 'length',
      label: 'menu.length',
      values: ['short', 'standard', 'long'],
      initial: 'standard',
    },
  ],
  init: (seed, o) => newPong(seed, o.level ?? 'medium', TARGETS[o.length ?? 'standard'] ?? 5),
  step: stepPong,
  over: pongOver,
  score: (s) => s.scores[0],
  hud: (s) => [
    ['hud.you', s.scores[0]],
    ['hud.cpu', s.scores[1]],
    ['hud.to', s.target],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#0b0e17';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(s.scores[0]), W / 2 - 50, 52);
    ctx.fillText(String(s.scores[1]), W / 2 + 50, 52);
    ctx.fillStyle = '#7c5cff';
    ctx.fillRect(LEFT_X, s.left, PADDLE_W, PADDLE_H);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(RIGHT_X, s.right, PADDLE_W, PADDLE_H);
    if (s.serve === 0) {
      if (!reducedMotion) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(
          s.ball.x - s.ball.vx * 2 - BALL / 2,
          s.ball.y - s.ball.vy * 2 - BALL / 2,
          BALL,
          BALL,
        );
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.ball.x - BALL / 2, s.ball.y - BALL / 2, BALL, BALL);
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      const centre = s.left + PADDLE_H / 2;
      if (pointer.y < centre - 4) return 'up';
      if (pointer.y > centre + 4) return 'down';
      return 'idle';
    }
    if (held.has('up') && !held.has('down')) return 'up';
    if (held.has('down') && !held.has('up')) return 'down';
    return 'idle';
  },
  touch: ['up', 'down'],
  pointer: true,
  policies: { tracker: trackerPolicy, follower: followerPolicy },
  sounds(_prev, next) {
    const out: string[] = [];
    for (const e of next.events)
      out.push(
        e === 'paddle'
          ? 'paddle'
          : e === 'wall'
            ? 'wall'
            : e === 'point-left'
              ? 'scored'
              : 'conceded',
      );
    if (pongOver(next)) out.push(next.scores[0] > next.scores[1] ? 'win' : 'lose');
    return out;
  },
  soundBank: {
    paddle: [{ wave: 'square', freq: 520, duration: 0.05, gain: 0.08 }],
    wall: [{ wave: 'square', freq: 300, duration: 0.04, gain: 0.06 }],
    scored: [{ wave: 'triangle', freq: 660, freqEnd: 990, duration: 0.18, gain: 0.12 }],
    conceded: [{ wave: 'sawtooth', freq: 260, freqEnd: 140, duration: 0.25, gain: 0.07 }],
    win: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
      { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
      { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
    ],
    lose: [
      { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
      { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
    ],
  },
  result: (s, o) => ({
    outcome: s.scores[0] > s.scores[1] ? 'win' : 'loss',
    score: s.scores[0] - s.scores[1],
    mode: `${o.level}-${o.length}`,
  }),
  achievements(s, o, unlock) {
    if (s.bestRally >= 20) unlock('rally');
    if (s.scores[0] <= s.scores[1]) return;
    unlock('first');
    if (o.level === 'hard') unlock('hard');
    if (s.scores[1] === 0) unlock('shutout');
  },
  ending: (s) => [
    s.scores[0] > s.scores[1] ? 'end.win' : 'end.lose',
    { a: s.scores[0], b: s.scores[1] },
  ],
  validate: isPong,
  strings: {
    en: {
      title: 'Pong',
      'menu.subtitle':
        'Two paddles, one ball: keep it in play and get it past the computer. Hit it near the edge of your paddle for a steeper angle.',
      'menu.level': 'Opponent',
      'level.easy': 'Easy',
      'level.medium': 'Medium',
      'level.hard': 'Hard',
      'level.easy.hint': 'A slow paddle that aims loosely.',
      'level.medium.hint': 'Quicker, with a steadier aim.',
      'level.hard.hint': 'Fast and accurate — angle your returns.',
      'menu.length': 'Game',
      'length.short': 'To 3',
      'length.standard': 'To 5',
      'length.long': 'To 11',
      'hud.you': 'You',
      'hud.cpu': 'Computer',
      'hud.to': 'First to',
      'end.win': 'You win {a}–{b}!',
      'end.lose': 'The computer wins {b}–{a}.',
    },
    es: {
      title: 'Pong',
      'menu.subtitle':
        'Dos palas y una pelota: mantenla en juego y cuélasela al ordenador. Golpéala cerca del borde de tu pala para darle más ángulo.',
      'menu.level': 'Rival',
      'level.easy': 'Fácil',
      'level.medium': 'Medio',
      'level.hard': 'Difícil',
      'level.easy.hint': 'Una pala lenta que apunta sin precisión.',
      'level.medium.hint': 'Más rápida y con mejor puntería.',
      'level.hard.hint': 'Rápida y precisa: dale ángulo a tus devoluciones.',
      'menu.length': 'Partida',
      'length.short': 'A 3',
      'length.standard': 'A 5',
      'length.long': 'A 11',
      'hud.you': 'Tú',
      'hud.cpu': 'Ordenador',
      'hud.to': 'Gana a',
      'end.win': '¡Ganas {a}–{b}!',
      'end.lose': 'Gana el ordenador {b}–{a}.',
    },
  },
};
