/** Falling Blocks Classic on the shared falling-blocks core and arcade shell. */
import { blocksDef } from '../shared/blocks/definition';
import { CLASSIC } from '../shared/blocks/sim';

export const DEF = blocksDef(CLASSIC, {
  prefix: 'fc',
  options: [{ id: 'start', label: 'menu.start', values: ['0', '9', '18'], initial: '0' }],
  achievements(s, unlock) {
    if (s.lines > 0) unlock('first');
    if (s.tetrises > 0) unlock('four');
    if (s.lines >= 100) unlock('hundred');
    // Starting at 18 does not count: the level has to be climbed.
    if (s.level >= 10 && s.level > s.startLevel) unlock('ten');
  },
  strings: {
    en: {
      title: 'Falling Blocks Classic',
      'menu.subtitle':
        'The 8-bit way: one piece of preview, no hold, no hard drop, no wall kicks — just quick hands and the classic speed table. How long can you last?',
      'hud.score': 'Score',
      'hud.lines': 'Lines',
      'hud.level': 'Level',
      'control.up': 'Rotate',
      'control.down': 'Soft drop',
      'control.fire': 'Hard drop',
      'end.topout': 'Topped out after {l} lines: {n} points.',
      'menu.start': 'Starting level',
      'start.0': '0',
      'start.9': '9',
      'start.18': '18',
      'start.0.hint': 'A gentle start; the speed climbs every ten lines.',
      'start.9.hint': 'Already quick from the first piece.',
      'start.18.hint': 'Very fast — for experts.',
    },
    es: {
      title: 'Bloques que caen clásico',
      'menu.subtitle':
        'Al estilo de 8 bits: una pieza de vista previa, sin reserva, sin caída rápida ni patadas, solo manos rápidas y la tabla de velocidad clásica. ¿Cuánto aguantas?',
      'hud.score': 'Puntos',
      'hud.lines': 'Líneas',
      'hud.level': 'Nivel',
      'control.up': 'Girar',
      'control.down': 'Bajar',
      'control.fire': 'Soltar',
      'end.topout': 'Pozo lleno tras {l} líneas: {n} puntos.',
      'menu.start': 'Nivel inicial',
      'start.0': '0',
      'start.9': '9',
      'start.18': '18',
      'start.0.hint': 'Un comienzo tranquilo; la velocidad sube cada diez líneas.',
      'start.9.hint': 'Rápido desde la primera pieza.',
      'start.18.hint': 'Muy rápido: para expertos.',
    },
  },
});
