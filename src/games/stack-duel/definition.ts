/** Stack Duel for the shared arcade shell: options, two wells, garbage meters, callouts, sounds, strings. */
import type { Translator } from '../../core/i18n';
import type { ArcadeDef } from '../shared/arcade/types';
import { block, mini } from '../shared/blocks/definition';
import { cells } from '../shared/blocks/pieces';
import { COLS, dropY, HIDDEN, ROWS, type Blocks } from '../shared/blocks/sim';
import { botKeys, type BotLevel } from './bot';
import {
  ACTIONS,
  BLITZ_STEPS,
  isDuel,
  newDuel,
  points,
  stepDuel,
  waiting,
  type Duel,
  type Mode,
} from './duel';

const CELL = 16;
const TOP = 30;
const W = 640;
const H = TOP + (ROWS - HIDDEN) * CELL + 10;

const apm = (d: Duel, seat: 0 | 1) =>
  d.total ? Math.round((d.sent[seat] / (d.total / 3600)) * 10) / 10 : 0;
const pps = (d: Duel, seat: 0 | 1) =>
  d.total ? (d.pieces[seat] / (d.total / 60)).toFixed(2) : '0.00';
const clock = (steps: number) => {
  const s = Math.max(0, steps) / 60;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

function well(ctx: CanvasRenderingContext2D, b: Blocks, x0: number, reducedMotion: boolean) {
  ctx.fillStyle = '#121726';
  ctx.fillRect(x0, TOP, COLS * CELL, (ROWS - HIDDEN) * CELL);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x0 + x * CELL, TOP);
    ctx.lineTo(x0 + x * CELL, TOP + (ROWS - HIDDEN) * CELL);
    ctx.stroke();
  }
  const at = (x: number, y: number) => [x0 + x * CELL, TOP + (y - HIDDEN) * CELL] as const;
  const flash = b.clearing.length && !reducedMotion && Math.floor(b.steps / 4) % 2 === 0;
  for (let y = HIDDEN; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const k = b.board[y * COLS + x];
      if (!k) continue;
      const [px, py] = at(x, y);
      if (b.clearing.includes(y)) {
        ctx.fillStyle = flash ? '#ffffff' : 'rgba(255,255,255,0.6)';
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      } else block(ctx, px, py, CELL, b.over ? 'G' : k);
    }
  if (b.piece && !b.over) {
    const p = b.piece;
    const gy = dropY(b.board, p);
    for (const [cx, cy] of cells(p.kind, p.r))
      if (gy + cy >= HIDDEN) block(ctx, ...at(p.x + cx, gy + cy), CELL, p.kind, true);
    for (const [cx, cy] of cells(p.kind, p.r))
      if (p.y + cy >= HIDDEN) block(ctx, ...at(p.x + cx, p.y + cy), CELL, p.kind);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0 - 1, TOP - 1, COLS * CELL + 2, (ROWS - HIDDEN) * CELL + 2);
}

function side(
  ctx: CanvasRenderingContext2D,
  b: Blocks,
  holdX: number,
  nextX: number,
  t: Translator,
) {
  ctx.fillStyle = '#9aa3b8';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(t('c.hold'), holdX, TOP + 8);
  ctx.fillText(t('c.next'), nextX, TOP + 8);
  ctx.strokeStyle = b.holdUsed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(holdX - 2, TOP + 14, 54, 38);
  if (b.hold) mini(ctx, b.hold, holdX + 4, TOP + 20);
  b.queue.slice(0, 5).forEach((k, i) => mini(ctx, k, nextX + 2, TOP + 20 + i * 36));
}

function meter(ctx: CanvasRenderingContext2D, d: Duel, seat: 0 | 1, x: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, TOP, 6, (ROWS - HIDDEN) * CELL);
  let y = TOP + (ROWS - HIDDEN) * CELL;
  for (const g of d.incoming[seat]) {
    const h = Math.min(g.lines * CELL, y - TOP);
    ctx.fillStyle = g.ready <= d.total ? '#e5484d' : '#f0a03a';
    ctx.fillRect(x, y - h, 6, h);
    y -= h;
    if (y <= TOP) break;
  }
}

function callout(
  ctx: CanvasRenderingContext2D,
  d: Duel,
  seat: 0 | 1,
  x: number,
  y: number,
  t: Translator,
) {
  const c = d.clears[seat];
  if (!c || d.total - c.at > 100) return;
  ctx.globalAlpha = Math.max(0.2, 1 - (d.total - c.at) / 100);
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px system-ui, sans-serif';
  let yy = y;
  for (const part of c.parts) {
    ctx.fillStyle =
      part === 'b2b'
        ? '#f1c40f'
        : part === 'allclear'
          ? '#4dd0e1'
          : part.startsWith('tspin')
            ? '#b15cff'
            : '#ffffff';
    ctx.fillText(part === 'combo' ? t('c.combo', { n: c.combo }) : t(`c.${part}`), x, yy);
    yy += 15;
  }
  if (d.mode === 'versus' && c.attack > 0) {
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`+${c.attack}`, x, yy + 4);
  }
  ctx.globalAlpha = 1;
}

function banner(ctx: CanvasRenderingContext2D, text: string, x: number, color: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, TOP + 130, COLS * CELL, 54);
  ctx.fillStyle = color;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + (COLS * CELL) / 2, TOP + 168);
}

export const DUEL: ArcadeDef<Duel, string> = {
  id: 'stack-duel',
  prefix: 'sd',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [
    { id: 'mode', label: 'menu.mode', values: ['versus', 'blitz', 'sprint'], initial: 'versus' },
    {
      id: 'bot',
      label: 'menu.bot',
      values: ['easy', 'medium', 'hard', 'expert'],
      initial: 'medium',
    },
    { id: 'rounds', label: 'menu.rounds', values: ['1', '2'], initial: '2' },
  ],
  init: (seed, o) =>
    newDuel(
      seed,
      (o.mode ?? 'versus') as Mode,
      (o.bot ?? 'medium') as BotLevel,
      Number(o.rounds ?? 2),
    ),
  step: stepDuel,
  over: (d) => d.over,
  score: (d) =>
    d.mode === 'versus' ? d.sent[0] : d.mode === 'blitz' ? points(d) : d.boards[0].lines,
  hud: (d) =>
    d.mode === 'versus'
      ? [
          ['hud.you', d.wins[0]],
          ['hud.bot', d.wins[1]],
          ['hud.apm', apm(d, 0)],
          ['hud.pps', pps(d, 0)],
        ]
      : d.mode === 'blitz'
        ? [
            ['hud.score', points(d)],
            ['hud.lines', d.boards[0].lines],
            ['hud.level', d.boards[0].level],
            ['hud.time', clock(BLITZ_STEPS - d.t)],
          ]
        : [
            ['hud.lines', `${d.boards[0].lines}/40`],
            ['hud.time', clock(d.t)],
            ['hud.pps', pps(d, 0)],
          ],
  draw(ctx, d, { reducedMotion, t }) {
    ctx.fillStyle = '#0b0e17';
    ctx.fillRect(0, 0, W, H);
    if (d.mode === 'versus') {
      const bot = d.boards[1]!;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${t('c.you')} ${'★'.repeat(d.wins[0])}`, 74 + 80, 18);
      ctx.fillText(`${t(`c.bot.${d.bot}`)} ${'★'.repeat(d.wins[1])}`, 394 + 80, 18);
      ctx.fillStyle = '#9aa3b8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(t('c.round', { n: d.round }), W / 2, 18);
      for (const [seat, b, x0] of [
        [0, d.boards[0], 74],
        [1, bot, 394],
      ] as const) {
        well(ctx, b, x0, reducedMotion);
        side(ctx, b, x0 - 66, x0 + COLS * CELL + 8, t);
        meter(ctx, d, seat, x0 - 9);
        callout(ctx, d, seat, x0 - 66, TOP + 76, t);
        ctx.fillStyle = '#9aa3b8';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${apm(d, seat)} ${t('c.apm')}`, x0 - 66, H - 40);
        ctx.fillText(`${pps(d, seat)} ${t('c.pps')}`, x0 - 66, H - 26);
        if (waiting(d, seat)) ctx.fillText(`▲${waiting(d, seat)}`, x0 - 66, H - 12);
      }
      if (d.roundWinner !== null || d.over) {
        const loser = d.roundWinner === 0 ? 1 : d.roundWinner === 1 ? 0 : null;
        for (const seat of [0, 1] as const) {
          const x0 = seat === 0 ? 74 : 394;
          if (loser === null || seat === loser) banner(ctx, t('c.ko'), x0, '#e5484d');
          else banner(ctx, '★', x0, '#f1c40f');
        }
      }
      return;
    }
    const b = d.boards[0];
    const x0 = (W - COLS * CELL) / 2;
    well(ctx, b, x0, reducedMotion);
    side(ctx, b, x0 - 70, x0 + COLS * CELL + 12, t);
    callout(ctx, d, 0, x0 - 70, TOP + 76, t);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(t(`mode.${d.mode}`), W / 2, 18);
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px system-ui, sans-serif';
    const big = d.mode === 'blitz' ? String(points(d)) : clock(d.t);
    ctx.fillText(big, x0 - 14, H - 40);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#9aa3b8';
    ctx.fillText(d.mode === 'blitz' ? clock(BLITZ_STEPS - d.t) : `${b.lines}/40`, x0 - 14, H - 22);
    if (d.over)
      banner(
        ctx,
        b.won || d.mode === 'blitz' ? t('c.finish') : t('c.ko'),
        x0,
        b.won || d.mode === 'blitz' ? '#f1c40f' : '#e5484d',
      );
  },
  control(_d, held) {
    let a = '';
    if (held.has('left') && !held.has('right')) a += 'L';
    else if (held.has('right') && !held.has('left')) a += 'R';
    if (held.has('up')) a += 'C';
    else if (held.has('ccw')) a += 'A';
    else if (held.has('alt')) a += 'F';
    if (held.has('down')) a += 'S';
    else if (held.has('fire')) a += 'H';
    if (held.has('hold')) a += 'K';
    return a || 'idle';
  },
  touch: ['left', 'right', 'down', 'fire', 'ccw', 'up', 'alt', 'hold'],
  pointer: false,
  policies: {
    bot: (d) => (d.boards[0].piece ? botKeys(d.boards[0], 'expert', 0.5) : 'idle'),
  },
  sounds: (_p, next) => next.events.filter((e) => e !== 'move' || next.total % 2 === 0),
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
    attack: [{ wave: 'sawtooth', freq: 300, freqEnd: 900, duration: 0.12, gain: 0.06 }],
    attacked: [{ wave: 'sawtooth', freq: 500, freqEnd: 200, duration: 0.12, gain: 0.05 }],
    cancel: [{ wave: 'sine', freq: 740, duration: 0.08, gain: 0.06 }],
    garbage: [{ wave: 'noise', freq: 0, duration: 0.12, gain: 0.1, lowpass: 500 }],
    allclear: [
      { wave: 'triangle', freq: 784, duration: 0.1, gain: 0.15 },
      { wave: 'triangle', freq: 1175, duration: 0.1, delay: 0.1, gain: 0.15 },
      { wave: 'triangle', freq: 1568, duration: 0.3, delay: 0.2, gain: 0.15 },
    ],
    ko: [{ wave: 'square', freq: 880, freqEnd: 1320, duration: 0.25, gain: 0.1 }],
    koed: [{ wave: 'square', freq: 330, freqEnd: 110, duration: 0.4, gain: 0.1 }],
    round: [{ wave: 'sine', freq: 660, duration: 0.15, gain: 0.08 }],
    goal: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
      { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.12, gain: 0.2 },
    ],
    end: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
      { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.12, gain: 0.2 },
    ],
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
    topout: [
      { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
      { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
    ],
  },
  result: (d) =>
    d.mode === 'versus'
      ? { outcome: d.winner === 0 ? 'win' : 'loss', score: d.sent[0], mode: `versus-${d.bot}` }
      : d.mode === 'blitz'
        ? { outcome: 'complete', score: points(d), mode: 'blitz' }
        : {
            outcome: d.boards[0].won ? 'complete' : 'fail',
            timeMs: d.boards[0].won ? Math.round((d.t / 60) * 1000) : undefined,
            score: d.boards[0].lines,
            mode: 'sprint',
          },
  achievements(d, _o, unlock) {
    if (d.quads > 0) unlock('quad');
    if (d.tspinClears > 0) unlock('tspin');
    if (d.allClears > 0) unlock('all-clear');
    if (d.maxCombo >= 5) unlock('combo');
    if (d.mode === 'versus' && d.winner === 0) {
      unlock('win');
      if (d.bot === 'hard' || d.bot === 'expert') unlock('hard');
      if (d.bot === 'expert') unlock('expert');
    }
    if (d.mode === 'sprint' && d.boards[0].won && d.t <= 90 * 60) unlock('sprint');
    if (d.mode === 'blitz' && points(d) >= 30000) unlock('blitz');
  },
  ending: (d) =>
    d.mode === 'versus'
      ? [d.winner === 0 ? 'end.win' : 'end.lose', { a: d.wins[0], b: d.wins[1], s: d.sent[0] }]
      : d.mode === 'blitz'
        ? ['end.blitz', { n: points(d), l: d.boards[0].lines }]
        : [
            d.boards[0].won ? 'end.sprint' : 'end.topout',
            { t: (d.t / 60).toFixed(2), l: d.boards[0].lines },
          ],
  validate: isDuel,
  strings: {
    en: {
      title: 'Stack Duel',
      'menu.subtitle':
        'Competitive falling blocks: clear lines to send garbage into the bot’s well, race 40 lines or chase a two-minute score.',
      'menu.mode': 'Mode',
      'mode.versus': 'Versus',
      'mode.blitz': 'Blitz',
      'mode.sprint': '40 Lines',
      'mode.versus.hint':
        'Battle a bot: doubles, triples, quads, T-spins and combos send garbage. Top out and you lose the round.',
      'mode.blitz.hint':
        'Score as many points as you can in two minutes; the speed climbs every ten lines.',
      'mode.sprint.hint': 'Clear 40 lines as fast as you can.',
      'menu.bot': 'Bot (versus)',
      'bot.easy': 'Easy',
      'bot.medium': 'Medium',
      'bot.hard': 'Hard',
      'bot.expert': 'Expert',
      'bot.easy.hint': 'About one piece a second, no hold, the odd misplaced piece.',
      'bot.medium.hint': 'About 1.5 pieces a second with hold.',
      'bot.hard.hint': 'About 2.3 pieces a second; builds for quads.',
      'bot.expert.hint': 'About 3.5 pieces a second and almost never slips.',
      'menu.rounds': 'Match (versus)',
      'rounds.1': 'One round',
      'rounds.2': 'First to 2',
      'hud.you': 'You',
      'hud.bot': 'Bot',
      'hud.apm': 'APM',
      'hud.pps': 'PPS',
      'hud.score': 'Score',
      'hud.lines': 'Lines',
      'hud.level': 'Level',
      'hud.time': 'Time',
      'c.you': 'YOU',
      'c.bot.easy': 'BOT · EASY',
      'c.bot.medium': 'BOT · MEDIUM',
      'c.bot.hard': 'BOT · HARD',
      'c.bot.expert': 'BOT · EXPERT',
      'c.round': 'ROUND {n}',
      'c.hold': 'HOLD',
      'c.next': 'NEXT',
      'c.apm': 'APM',
      'c.pps': 'PPS',
      'c.ko': 'K.O.',
      'c.finish': 'FINISH',
      'c.single': 'SINGLE',
      'c.double': 'DOUBLE',
      'c.triple': 'TRIPLE',
      'c.quad': 'QUAD',
      'c.tspin-': 'T-SPIN',
      'c.tspin-single': 'T-SPIN SINGLE',
      'c.tspin-double': 'T-SPIN DOUBLE',
      'c.tspin-triple': 'T-SPIN TRIPLE',
      'c.b2b': 'BACK-TO-BACK',
      'c.combo': '{n} COMBO',
      'c.allclear': 'ALL CLEAR',
      'end.win': 'You win the match {a}–{b}, sending {s} lines.',
      'end.lose': 'The bot wins the match {b}–{a}.',
      'end.blitz': 'Time! {n} points, {l} lines.',
      'end.sprint': '40 lines in {t} s!',
      'end.topout': 'Topped out after {l} lines.',
    },
    es: {
      title: 'Duelo de bloques',
      'menu.subtitle':
        'Bloques que caen en modo competitivo: limpia líneas para mandar basura al pozo del bot, corre las 40 líneas o busca la máxima puntuación en dos minutos.',
      'menu.mode': 'Modo',
      'mode.versus': 'Duelo',
      'mode.blitz': 'Blitz',
      'mode.sprint': '40 líneas',
      'mode.versus.hint':
        'Enfréntate a un bot: dobles, triples, cuádruples, T-spins y combos mandan basura. Si te desbordas, pierdes la ronda.',
      'mode.blitz.hint':
        'Suma todos los puntos que puedas en dos minutos; la velocidad sube cada diez líneas.',
      'mode.sprint.hint': 'Limpia 40 líneas lo más rápido posible.',
      'menu.bot': 'Bot (duelo)',
      'bot.easy': 'Fácil',
      'bot.medium': 'Medio',
      'bot.hard': 'Difícil',
      'bot.expert': 'Experto',
      'bot.easy.hint': 'Una pieza por segundo, sin reserva y con algún fallo.',
      'bot.medium.hint': 'Unas 1,5 piezas por segundo, con reserva.',
      'bot.hard.hint': 'Unas 2,3 piezas por segundo; prepara cuádruples.',
      'bot.expert.hint': 'Unas 3,5 piezas por segundo y casi nunca falla.',
      'menu.rounds': 'Partida (duelo)',
      'rounds.1': 'Una ronda',
      'rounds.2': 'Al mejor de 3',
      'hud.you': 'Tú',
      'hud.bot': 'Bot',
      'hud.apm': 'APM',
      'hud.pps': 'PPS',
      'hud.score': 'Puntos',
      'hud.lines': 'Líneas',
      'hud.level': 'Nivel',
      'hud.time': 'Tiempo',
      'c.you': 'TÚ',
      'c.bot.easy': 'BOT · FÁCIL',
      'c.bot.medium': 'BOT · MEDIO',
      'c.bot.hard': 'BOT · DIFÍCIL',
      'c.bot.expert': 'BOT · EXPERTO',
      'c.round': 'RONDA {n}',
      'c.hold': 'RESERVA',
      'c.next': 'SIGUIENTES',
      'c.apm': 'APM',
      'c.pps': 'PPS',
      'c.ko': 'K.O.',
      'c.finish': 'FIN',
      'c.single': 'SENCILLA',
      'c.double': 'DOBLE',
      'c.triple': 'TRIPLE',
      'c.quad': 'CUÁDRUPLE',
      'c.tspin-': 'T-SPIN',
      'c.tspin-single': 'T-SPIN SENCILLO',
      'c.tspin-double': 'T-SPIN DOBLE',
      'c.tspin-triple': 'T-SPIN TRIPLE',
      'c.b2b': 'SEGUIDOS',
      'c.combo': 'COMBO {n}',
      'c.allclear': 'POZO LIMPIO',
      'end.win': 'Ganas la partida {a}–{b} mandando {s} líneas.',
      'end.lose': 'El bot gana la partida {b}–{a}.',
      'end.blitz': '¡Tiempo! {n} puntos y {l} líneas.',
      'end.sprint': '¡40 líneas en {t} s!',
      'end.topout': 'Desbordado tras {l} líneas.',
    },
  },
};
