import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the hunt games (each module adds names for its pieces and goals). */
export const HUNT_STRINGS: Record<Locale, Dictionary> = {
  en: {
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'point.empty': 'empty',
    'point.target': 'move here',
    'point.place': 'place here',
    'action.stop': 'End the jumps',
    'announce.move': '{seat}: {from}–{to}.',
    'announce.jump': '{seat} jumps {from}–{to} and captures.',
    'announce.place': '{seat} places on {to}.',
    'announce.stop': '{seat} stops jumping.',
    'result.trapped': 'The hunters cannot move: trapped!',
    'result.captures': 'The hunters captured enough prey.',
    'result.stuck': 'The prey have no move left.',
    keys: 'Keys: arrows move · Enter select / move / place · Esc cancel · U undo · H hint · R restart · N next',
  },
  es: {
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'point.empty': 'vacío',
    'point.target': 'mover aquí',
    'point.place': 'colocar aquí',
    'action.stop': 'Terminar los saltos',
    'announce.move': '{seat}: {from}–{to}.',
    'announce.jump': '{seat} salta {from}–{to} y captura.',
    'announce.place': '{seat} coloca en {to}.',
    'announce.stop': '{seat} deja de saltar.',
    'result.trapped': 'Los cazadores no pueden moverse: ¡atrapados!',
    'result.captures': 'Los cazadores capturaron suficientes presas.',
    'result.stuck': 'Las presas no tienen jugadas.',
    keys: 'Teclas: flechas mover · Intro elegir / mover / colocar · Esc cancelar · U deshacer · H pista · R reiniciar · N siguiente',
  },
};
