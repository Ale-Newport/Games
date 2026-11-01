/** Diving Swarm for the shared arcade shell: original sprites, controls, sounds, results, strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  PLAYER_W,
  PLAYER_Y,
  SIZE,
  W,
  flierPos,
  isSwarm,
  newSwarm,
  pilotPolicy,
  stepSwarm,
  sweeperPolicy,
  type Swarm,
  type SwarmAction,
} from './sim';

const ROW_COLOURS = ['#f1c40f', '#e5484d', '#b15cff', '#5aa9e6', '#5aa9e6'];

function flier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  row: number,
  flap: boolean,
  diving: boolean,
) {
  const c = ROW_COLOURS[row]!;
  const s = SIZE / 2;
  ctx.fillStyle = c;
  // Body.
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.45, s * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings, flapping.
  const wy = flap ? -s * 0.3 : s * 0.2;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y);
  ctx.lineTo(x - s * 1.1, y + wy);
  ctx.lineTo(x - s * 0.4, y + s * 0.6);
  ctx.moveTo(x + s * 0.3, y);
  ctx.lineTo(x + s * 1.1, y + wy);
  ctx.lineTo(x + s * 0.4, y + s * 0.6);
  ctx.fill();
  ctx.fillStyle = diving ? '#ffffff' : '#0b0e17';
  ctx.fillRect(x - 2, y - s * 0.3, 1.5, 1.5);
  ctx.fillRect(x + 0.5, y - s * 0.3, 1.5, 1.5);
  if (row === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - s - 2, 2, 3);
  }
}

export const SWARM: ArcadeDef<Swarm, SwarmAction> = {
  id: 'diving-swarm',
  prefix: 'ds',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newSwarm(seed),
  step: stepSwarm,
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.wave', s.wave],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 4 === 0 ? 'rgba(241,196,15,0.5)' : 'rgba(255,255,255,0.4)';
      ctx.fillRect(
        (i * 71) % W,
        (i * 37 + (reducedMotion ? 0 : s.steps * (0.4 + (i % 3) * 0.3))) % H,
        1.5,
        1.5,
      );
    }
    const flap = Math.floor(s.steps / 12) % 2 === 0;
    for (const f of s.fliers) {
      if (!f.alive) continue;
      const p = flierPos(s, f);
      flier(ctx, p.x, p.y, f.row, flap, !!f.dive);
    }
    ctx.fillStyle = '#ffe08a';
    for (const b of s.bullets) ctx.fillRect(b.x - 1, b.y - 3, 2, 6);
    if (s.missile) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.missile.x - 1, s.missile.y, 2, 9);
    }
    if (s.dying > 0) {
      ctx.fillStyle = s.dying % 10 < 5 ? '#e5484d' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(s.player, PLAYER_Y + 2, 6 + (90 - s.dying) / 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e6f2ea';
      ctx.beginPath();
      ctx.moveTo(s.player, PLAYER_Y - 10);
      ctx.lineTo(s.player + PLAYER_W / 2, PLAYER_Y + 8);
      ctx.lineTo(s.player - PLAYER_W / 2, PLAYER_Y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7c5cff';
      ctx.fillRect(s.player - 2, PLAYER_Y - 2, 4, 6);
    }
  },
  control(_s, held) {
    const fire = held.has('fire') || held.has('up');
    const l = held.has('left') && !held.has('right');
    const r = held.has('right') && !held.has('left');
    if (l) return fire ? 'left-fire' : 'left';
    if (r) return fire ? 'right-fire' : 'right';
    return fire ? 'fire' : 'idle';
  },
  touch: ['left', 'fire', 'right'],
  pointer: false,
  policies: { pilot: pilotPolicy, sweeper: sweeperPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    shoot: [{ wave: 'square', freq: 1000, freqEnd: 500, duration: 0.05, gain: 0.05 }],
    kill: [{ wave: 'noise', freq: 0, duration: 0.1, gain: 0.08, lowpass: 2600 }],
    'commander-down': [
      { wave: 'noise', freq: 0, duration: 0.15, gain: 0.1, lowpass: 2000 },
      { wave: 'triangle', freq: 1320, duration: 0.12, delay: 0.1, gain: 0.1 },
    ],
    dive: [{ wave: 'sine', freq: 900, freqEnd: 300, duration: 0.4, gain: 0.04 }],
    commander: [{ wave: 'sine', freq: 500, freqEnd: 1000, duration: 0.3, gain: 0.05 }],
    hit: [{ wave: 'sawtooth', freq: 220, freqEnd: 60, duration: 0.6, gain: 0.1 }],
    extra: [{ wave: 'triangle', freq: 990, duration: 0.2, gain: 0.12 }],
    wave: [
      { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.16, delay: 0.09, gain: 0.14 },
    ],
    over: [
      { wave: 'triangle', freq: 392, duration: 0.18, gain: 0.15 },
      { wave: 'triangle', freq: 294, duration: 0.4, delay: 0.16, gain: 0.15 },
    ],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'classic' }),
  achievements(s, _o, unlock) {
    unlock('first');
    if (s.wave >= 2) unlock('wave');
    if (s.wave >= 4) unlock('veteran');
    if (s.score >= 8000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, w: s.wave }],
  validate: isSwarm,
  strings: {
    en: {
      title: 'Diving Swarm',
      'menu.subtitle':
        'The swarm sways overhead and peels off in looping dives, firing as it comes. Shoot divers for double points — and watch for commanders leading their guards.',
      'hud.score': 'Score',
      'hud.lives': 'Ships',
      'hud.wave': 'Swarm',
      'end.over': 'Game over on swarm {w}: {n} points.',
    },
    es: {
      title: 'Enjambre en picado',
      'menu.subtitle':
        'El enjambre se balancea arriba y se lanza en picados con bucle, disparando al venir. Los que bajan valen el doble; ojo con los comandantes que bajan con su escolta.',
      'hud.score': 'Puntos',
      'hud.lives': 'Naves',
      'hud.wave': 'Enjambre',
      'end.over': 'Fin de la partida en el enjambre {w}: {n} puntos.',
    },
  },
};
