/** Circuit Sprint for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  LAPS,
  TRACKS,
  W,
  driverFor,
  isRace,
  lineOf,
  newRace,
  placeOf,
  scoreOf,
  stepWithField,
  type Race,
  type RaceAction,
} from './sim';

const CAR_COLOURS = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'];

export const DEF: ArcadeDef<Race, RaceAction> = {
  id: 'top-down-racing',
  prefix: 'tr',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [{ id: 'track', label: 'menu.track', values: TRACKS, initial: TRACKS[0]! }],
  init: (seed, o) => newRace(seed, o.track ?? TRACKS[0]),
  step: (s, a) => stepWithField(s, a),
  over: (s) => s.over,
  score: (s) => scoreOf(s),
  hud: (s) => [
    ['hud.lap', `${Math.min(LAPS, s.cars[0]!.laps + 1)}/${LAPS}`],
    ['hud.place', placeOf(s)],
    ['hud.time', (s.clock / 60).toFixed(1)],
  ],
  draw(ctx, s) {
    ctx.fillStyle = '#3f6212';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4d7c0f';
    for (let k = 0; k < 60; k++) ctx.fillRect((k * 53) % W, (k * 37) % H, 3, 2);
    const line = lineOf(s.track);
    const path = () => {
      ctx.beginPath();
      line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 30;
    path();
    ctx.stroke();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 26;
    path();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    path();
    ctx.stroke();
    ctx.setLineDash([]);
    // The chequered start line across the track.
    const [x0, y0] = line[0]!;
    const [x1, y1] = line[1]!;
    const a = Math.atan2(y1 - y0, x1 - x0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(a);
    for (let k = -13; k < 13; k += 3)
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (k / 3 + j) % 2 ? '#0f172a' : '#f8fafc';
        ctx.fillRect(j * 3 - 3, k, 3, 3);
      }
    ctx.restore();
    // Cars.
    s.cars.forEach((c, i) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.a);
      ctx.fillStyle = CAR_COLOURS[i]!;
      ctx.fillRect(-5, -3, 10, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1, -2.5, 2.5, 5);
      ctx.fillRect(-5, -4, 3, 1.5);
      ctx.fillRect(-5, 2.5, 3, 1.5);
      ctx.fillRect(2, -4, 3, 1.5);
      ctx.fillRect(2, 2.5, 3, 1.5);
      ctx.restore();
    });
    // Start lights.
    if (s.countdown > 0) {
      const lit = 3 - Math.floor(s.countdown / 40);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(W / 2 - 30 + k * 22, 8, 16, 16);
        ctx.fillStyle = k < lit ? '#ef4444' : '#334155';
        ctx.beginPath();
        ctx.arc(W / 2 - 22 + k * 22, 16, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      // Point where to go: steer towards the finger and keep the throttle on.
      const c = s.cars[0]!;
      const want = Math.atan2(pointer.y - c.y, pointer.x - c.x);
      const err = Math.atan2(Math.sin(want - c.a), Math.cos(want - c.a));
      const steer = Math.abs(err) < 0.08 ? '' : err > 0 ? 'right' : 'left';
      return (steer ? `gas-${steer}` : 'gas') as RaceAction;
    }
    const pedal = held.has('up') || held.has('fire') ? 'gas' : held.has('down') ? 'brake' : '';
    const steer =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    return ([pedal, steer].filter(Boolean).join('-') || 'idle') as RaceAction;
  },
  touch: ['left', 'down', 'up', 'right'],
  pointer: true,
  policies: { driver: (s) => driverFor(s, 0, 0.8), cautious: (s) => driverFor(s, 0, 1.5) },
  sounds: (_p, next) => [
    ...next.events,
    ...(next.countdown === 0 && next.cars[0]!.v > 0.3 && next.steps % 10 === 0 ? ['engine'] : []),
  ],
  soundBank: {
    engine: [{ wave: 'sawtooth', freq: 90, freqEnd: 110, duration: 0.12, gain: 0.025 }],
    beep: [{ wave: 'square', freq: 440, duration: 0.15, gain: 0.08 }],
    go: [{ wave: 'square', freq: 880, duration: 0.3, gain: 0.1 }],
    lap: [{ wave: 'triangle', freq: 660, freqEnd: 990, duration: 0.2, gain: 0.1 }],
    bump: [{ wave: 'square', freq: 150, duration: 0.05, gain: 0.05 }],
    finish: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.24, gain: 0.16 },
    ],
    'rival-finish': [{ wave: 'triangle', freq: 392, duration: 0.15, gain: 0.06 }],
  },
  result: (s, o) => ({
    outcome: s.cars[0]!.done !== null && placeOf(s) === 1 ? 'win' : 'loss',
    score: scoreOf(s),
    ...(s.cars[0]!.done !== null ? { timeMs: Math.round((s.cars[0]!.done / 60) * 1000) } : {}),
    mode: `track:${o.track ?? TRACKS[0]}`,
  }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('lap')) unlock('lap');
    if (s.over && s.cars[0]!.done !== null) unlock('finish');
    if (s.over && s.cars[0]!.done !== null && placeOf(s) === 1) unlock('win');
    if (s.over && s.cars[0]!.done !== null && placeOf(s) === 1 && s.track === 'loop')
      unlock('loop');
  },
  ending: (s) =>
    s.cars[0]!.done !== null
      ? ['end.finished', { p: placeOf(s), t: (s.cars[0]!.done! / 60).toFixed(1) }]
      : ['end.dnf', { p: placeOf(s) }],
  validate: (d: unknown): d is Race => isRace(d),
  strings: {
    en: {
      title: 'Circuit Sprint',
      'menu.subtitle':
        'Three laps against three computer drivers. Brake before the bends and stay off the grass.',
      'menu.track': 'Circuit',
      'track.oval': 'Oval',
      'track.kidney': 'Kidney',
      'track.loop': 'Loop',
      'track.oval.hint': 'Two long straights and two easy bends.',
      'track.kidney.hint': 'A long sweep with a dip on one side.',
      'track.loop.hint': 'Twists and an S-bend: the hardest.',
      'hud.lap': 'Lap',
      'hud.place': 'Place',
      'hud.time': 'Time',
      'control.up': 'Throttle',
      'control.down': 'Brake',
      'end.finished': 'Finished in place {p} in {t} s.',
      'end.dnf': 'The race ended with you in place {p}.',
    },
    es: {
      title: 'Sprint en circuito',
      'menu.subtitle':
        'Tres vueltas contra tres pilotos del ordenador. Frena antes de las curvas y no pises la hierba.',
      'menu.track': 'Circuito',
      'track.oval': 'Óvalo',
      'track.kidney': 'Riñón',
      'track.loop': 'Lazo',
      'track.oval.hint': 'Dos rectas largas y dos curvas suaves.',
      'track.kidney.hint': 'Una gran curva con una entrada en un lado.',
      'track.loop.hint': 'Giros y una chicane: el más difícil.',
      'hud.lap': 'Vuelta',
      'hud.place': 'Puesto',
      'hud.time': 'Tiempo',
      'control.up': 'Acelerar',
      'control.down': 'Frenar',
      'end.finished': 'Has terminado en el puesto {p} en {t} s.',
      'end.dnf': 'La carrera ha terminado contigo en el puesto {p}.',
    },
  },
};
