/** Disc Soccer for the shared arcade shell: options, pitch drawing, controls, sounds and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  BALL_R,
  CY,
  GOAL_DEPTH,
  GOAL_HALF,
  H,
  PLAYER_R,
  PX0,
  PX1,
  PY0,
  PY1,
  W,
  botAction,
  isSoccer,
  newSoccer,
  soccerOver,
  stepWithBots,
  winner,
  type Level,
  type Soccer,
  type SoccerAction,
} from './sim';

const clock = (s: Soccer) => {
  const left = Math.max(0, Math.ceil((s.length - s.t) / 60));
  return s.overtime
    ? `+${Math.floor((s.t - s.length) / 60)}`
    : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
};

export const SOCCER: ArcadeDef<Soccer, SoccerAction> = {
  id: 'disc-soccer',
  prefix: 'ds',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [
    { id: 'size', label: 'menu.size', values: ['1', '2', '3'], initial: '2' },
    { id: 'level', label: 'menu.level', values: ['easy', 'medium', 'hard'], initial: 'medium' },
    { id: 'length', label: 'menu.length', values: ['3', '5'], initial: '3' },
  ],
  init: (seed, o) =>
    newSoccer(
      seed,
      Number(o.size ?? 2) as 1 | 2 | 3,
      (o.level ?? 'medium') as Level,
      Number(o.length ?? 3),
      Number(o.length ?? 3),
    ),
  step: stepWithBots,
  over: soccerOver,
  score: (s) => s.score[0] - s.score[1],
  hud: (s) => [
    ['hud.red', s.score[0]],
    ['hud.blue', s.score[1]],
    ['hud.time', clock(s)],
  ],
  draw(ctx, s, { reducedMotion, t }) {
    // Grass with mowing stripes.
    ctx.fillStyle = '#3f7f3f';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#468a46' : '#3f7f3f';
      ctx.fillRect(PX0 + ((PX1 - PX0) / 12) * i, PY0, (PX1 - PX0) / 12, PY1 - PY0);
    }
    ctx.strokeStyle = '#d6efd6';
    ctx.lineWidth = 3;
    ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
    ctx.beginPath();
    ctx.moveTo(W / 2, PY0);
    ctx.lineTo(W / 2, PY1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, CY, 70, 0, Math.PI * 2);
    ctx.stroke();
    // Goals and nets.
    for (const [x, dir, color] of [
      [PX0, -1, '#e5534b'],
      [PX1, 1, '#4b8be5'],
    ] as const) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(dir < 0 ? x - GOAL_DEPTH : x, CY - GOAL_HALF, GOAL_DEPTH, GOAL_HALF * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(dir < 0 ? x - GOAL_DEPTH : x, CY - GOAL_HALF, GOAL_DEPTH, GOAL_HALF * 2);
      for (const y of [CY - GOAL_HALF, CY + GOAL_HALF]) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.stroke();
      }
    }
    // Players.
    s.players.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fillStyle = p.team === 0 ? '#e5534b' : '#4b8be5';
      ctx.fill();
      ctx.lineWidth = p.kicking ? 4 : 2;
      ctx.strokeStyle = p.kicking ? '#ffffff' : '#111111';
      ctx.stroke();
      if (i === 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', p.x, p.y + 5);
      }
    });
    // Ball (with a short trail).
    if (!reducedMotion) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(s.ball.x - s.ball.vx * 2, s.ball.y - s.ball.vy * 2, BALL_R * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#111';
    ctx.stroke();
    if (s.pause > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, CY - 34, W, 68);
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('goal'), W / 2, CY + 14);
    }
  },
  control(_s, held) {
    let d = '';
    if (held.has('up') && !held.has('down')) d += 'u';
    else if (held.has('down') && !held.has('up')) d += 'd';
    if (held.has('left') && !held.has('right')) d += 'l';
    else if (held.has('right') && !held.has('left')) d += 'r';
    const k = held.has('fire') || held.has('alt') ? 'k' : '';
    if (!d && !k) return 'idle';
    return (d + k) as SoccerAction;
  },
  touch: ['left', 'up', 'down', 'right', 'fire'],
  pointer: false,
  policies: {
    striker: (s) => botAction(s, 0),
  },
  sounds(_prev, next) {
    const out: string[] = [];
    for (const e of next.events)
      out.push(e === 'goal-red' ? 'scored' : e === 'goal-blue' ? 'conceded' : e);
    if (soccerOver(next)) out.push(winner(next) === 0 ? 'win' : 'lose');
    return out;
  },
  soundBank: {
    kick: [{ wave: 'square', freq: 220, freqEnd: 140, duration: 0.06, gain: 0.09 }],
    bounce: [{ wave: 'sine', freq: 300, duration: 0.04, gain: 0.05 }],
    whistle: [
      { wave: 'sine', freq: 2200, duration: 0.12, gain: 0.08 },
      { wave: 'sine', freq: 2200, duration: 0.2, delay: 0.16, gain: 0.08 },
    ],
    scored: [
      { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.15 },
      { wave: 'triangle', freq: 784, duration: 0.25, delay: 0.09, gain: 0.15 },
    ],
    conceded: [{ wave: 'sawtooth', freq: 260, freqEnd: 140, duration: 0.3, gain: 0.07 }],
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
    outcome: winner(s) === 0 ? 'win' : winner(s) === 1 ? 'loss' : 'draw',
    score: s.score[0] - s.score[1],
    mode: `${o.size}v${o.size}-${o.level}`,
  }),
  achievements(s, o, unlock) {
    if (s.goalsBy[0]! > 0) unlock('first-goal');
    if (s.goalsBy[0]! >= 3) unlock('hat-trick');
    if (winner(s) !== 0) return;
    unlock('win');
    if (o.level === 'hard') unlock('hard');
    if (s.score[1] === 0) unlock('clean-sheet');
    if (s.overtime) unlock('golden-goal');
  },
  ending: (s) => [winner(s) === 0 ? 'end.win' : 'end.lose', { a: s.score[0], b: s.score[1] }],
  validate: isSoccer,
  strings: {
    en: {
      title: 'Disc Soccer',
      'menu.subtitle':
        'Top-down physics football with discs. Run with the arrows or WASD and kick with Space or X — line up behind the ball and shoot!',
      'menu.size': 'Teams',
      'size.1': '1 v 1',
      'size.2': '2 v 2',
      'size.3': '3 v 3',
      'size.1.hint': 'Just you against one bot.',
      'size.2.hint': 'You and a bot teammate against two bots.',
      'size.3.hint': 'You and two bot teammates against three bots.',
      'menu.level': 'Bots',
      'level.easy': 'Easy',
      'level.medium': 'Medium',
      'level.hard': 'Hard',
      'level.easy.hint': 'Late and loose with their aim.',
      'level.medium.hint': 'Solid positioning, decent shots.',
      'level.hard.hint': 'Quick to the ball and accurate.',
      'menu.length': 'Match',
      'length.3': '3 min / 3 goals',
      'length.5': '5 min / 5 goals',
      'hud.red': 'Red',
      'hud.blue': 'Blue',
      'hud.time': 'Time',
      goal: 'GOAL!',
      'end.win': 'Red wins {a}–{b}!',
      'end.lose': 'Blue wins {b}–{a}.',
    },
    es: {
      title: 'Fútbol de discos',
      'menu.subtitle':
        'Fútbol con física visto desde arriba, jugado con discos. Corre con las flechas o WASD y chuta con Espacio o X: colócate detrás del balón y ¡dispara!',
      'menu.size': 'Equipos',
      'size.1': '1 contra 1',
      'size.2': '2 contra 2',
      'size.3': '3 contra 3',
      'size.1.hint': 'Tú contra un bot.',
      'size.2.hint': 'Tú y un bot compañero contra dos bots.',
      'size.3.hint': 'Tú y dos bots compañeros contra tres bots.',
      'menu.level': 'Bots',
      'level.easy': 'Fácil',
      'level.medium': 'Medio',
      'level.hard': 'Difícil',
      'level.easy.hint': 'Llegan tarde y apuntan mal.',
      'level.medium.hint': 'Bien colocados y con buenos tiros.',
      'level.hard.hint': 'Rápidos al balón y precisos.',
      'menu.length': 'Partido',
      'length.3': '3 min / 3 goles',
      'length.5': '5 min / 5 goles',
      'hud.red': 'Rojo',
      'hud.blue': 'Azul',
      'hud.time': 'Tiempo',
      goal: '¡GOL!',
      'end.win': '¡Gana el rojo {a}–{b}!',
      'end.lose': 'Gana el azul {b}–{a}.',
    },
  },
};
