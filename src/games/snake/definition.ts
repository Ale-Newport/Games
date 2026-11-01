/** Classic Snake on the shared snake core and arcade shell. */
import { snakeDef } from '../shared/snake/definition';
import { CLASSIC } from '../shared/snake/sim';

export const DEF = snakeDef(CLASSIC, {
  prefix: 'sn',
  achievements(s, unlock) {
    if (s.eaten > 0) unlock('first');
    if (s.body.length >= 20) unlock('twenty');
    if (s.body.length >= 50) unlock('fifty');
    if (s.score >= 1000) unlock('score');
  },
  strings: {
    en: {
      title: 'Classic Snake',
      'menu.subtitle':
        'Eat, grow and don’t bite yourself — or the walls. The snake speeds up as it grows.',
      'hud.score': 'Score',
      'hud.length': 'Length',
      'end.crash': 'Crashed at length {l}: {n} points.',
      'end.full': 'The board is full — {n} points!',
    },
    es: {
      title: 'Serpiente clásica',
      'menu.subtitle':
        'Come, crece y no te muerdas, ni choques con las paredes. La serpiente acelera al crecer.',
      'hud.score': 'Puntos',
      'hud.length': 'Longitud',
      'end.crash': 'Chocaste con longitud {l}: {n} puntos.',
      'end.full': '¡El tablero está lleno: {n} puntos!',
    },
  },
});
