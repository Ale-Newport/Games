/** Falling Blocks on the shared falling-blocks core and arcade shell. */
import { blocksDef } from '../shared/blocks/definition';
import { MODERN } from '../shared/blocks/sim';

export const DEF = blocksDef(MODERN, {
  prefix: 'fb',
  options: [
    { id: 'mode', label: 'menu.mode', values: ['marathon', 'sprint'], initial: 'marathon' },
  ],
  achievements(s, unlock) {
    if (s.lines > 0) unlock('first');
    if (s.tetrises > 0) unlock('four');
    if (s.tspins > 0) unlock('tspin');
    if (s.won) unlock('goal');
  },
  strings: {
    en: {
      title: 'Falling Blocks',
      'menu.subtitle':
        'Rotate, slide and drop the seven pieces to clear lines: with a hold box, five-piece preview, ghost piece, wall kicks, T-spins and back-to-back bonuses.',
      'hud.score': 'Score',
      'hud.lines': 'Lines',
      'hud.level': 'Level',
      'control.up': 'Rotate',
      'control.down': 'Soft drop',
      'control.fire': 'Hard drop',
      'end.topout': 'Topped out after {l} lines: {n} points.',
      'menu.mode': 'Mode',
      'mode.marathon': 'Marathon',
      'mode.sprint': 'Sprint',
      'mode.marathon.hint': 'Clear 150 lines as the pieces speed up.',
      'mode.sprint.hint': 'Clear 40 lines as fast as you can.',
      'end.goal': 'Marathon complete — {n} points!',
      'end.sprint': '40 lines in {t} s!',
      'hud.time': 'Time',
    },
    es: {
      title: 'Bloques que caen',
      'menu.subtitle':
        'Gira, desliza y suelta las siete piezas para completar líneas: con reserva, cinco piezas de vista previa, pieza fantasma, rotación con «patadas», giros en T y bonificaciones seguidas.',
      'hud.score': 'Puntos',
      'hud.lines': 'Líneas',
      'hud.level': 'Nivel',
      'control.up': 'Girar',
      'control.down': 'Bajar',
      'control.fire': 'Soltar',
      'end.topout': 'Pozo lleno tras {l} líneas: {n} puntos.',
      'menu.mode': 'Modo',
      'mode.marathon': 'Maratón',
      'mode.sprint': 'Sprint',
      'mode.marathon.hint': 'Despeja 150 líneas mientras las piezas aceleran.',
      'mode.sprint.hint': 'Despeja 40 líneas lo más rápido posible.',
      'end.goal': '¡Maratón completado: {n} puntos!',
      'end.sprint': '¡40 líneas en {t} s!',
      'hud.time': 'Tiempo',
    },
  },
});
