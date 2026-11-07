/** Wraparound Snake on the shared snake core and arcade shell. */
import { snakeDef } from '../shared/snake/definition';
import { WRAPAROUND } from '../shared/snake/sim';

export const DEF = snakeDef(WRAPAROUND, {
  prefix: 'ws',
  achievements(s, unlock) {
    if (s.eaten > 0) unlock('first');
    if (s.goldens > 0) unlock('golden');
    if (s.body.length >= 50) unlock('fifty');
    if (s.score >= 2000) unlock('score');
  },
  strings: {
    en: {
      title: 'Wraparound Snake',
      'menu.subtitle':
        'No walls: leave one edge and come back on the other. But blocks appear as you eat, and golden fruit only lasts a few seconds.',
      'hud.score': 'Score',
      'hud.length': 'Length',
      'end.crash': 'Crashed at length {l}: {n} points.',
      'end.full': 'The board is full — {n} points!',
      'end.time': 'Time! {n} points at length {l}.',
      'menu.run': 'Run',
      'run.endless': 'Endless',
      'run.sprint': 'One-minute sprint',
      'run.endless.hint': 'Play until you crash.',
      'run.sprint.hint': 'Score as much as you can in sixty seconds.',
      'hud.time': 'Time',
    },
    es: {
      title: 'Serpiente sin bordes',
      'menu.subtitle':
        'Sin paredes: sal por un borde y vuelve por el opuesto. Pero aparecen bloques a medida que comes, y la fruta dorada dura solo unos segundos.',
      'hud.score': 'Puntos',
      'hud.length': 'Longitud',
      'end.crash': 'Chocaste con longitud {l}: {n} puntos.',
      'end.full': '¡El tablero está lleno: {n} puntos!',
      'end.time': '¡Tiempo! {n} puntos con longitud {l}.',
      'menu.run': 'Partida',
      'run.endless': 'Sin fin',
      'run.sprint': 'Sprint de un minuto',
      'run.endless.hint': 'Juega hasta chocar.',
      'run.sprint.hint': 'Suma todo lo que puedas en sesenta segundos.',
      'hud.time': 'Tiempo',
    },
  },
});
