import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the domino games (each module adds its title, seats and goal line). */
export const DOMINO_STRINGS: Record<Locale, Dictionary> = {
  en: {
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'board.label': 'Domino grid',
    'cell.empty': 'empty',
    'cell.covered': 'covered',
    'cell.partner': 'empty, completes the domino',
    'announce.place': '{seat} places a domino on {a} and {b}.',
    'result.blocked': '{seat} has no room for a domino.',
    keys: 'Keys: arrows move · Enter pick a cell, then a neighbor · Esc cancel · U undo · H hint · R restart · N next',
  },
  es: {
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'board.label': 'Cuadrícula de fichas',
    'cell.empty': 'vacía',
    'cell.covered': 'cubierta',
    'cell.partner': 'vacía, completa la ficha',
    'announce.place': '{seat} coloca una ficha en {a} y {b}.',
    'result.blocked': '{seat} no tiene sitio para una ficha.',
    keys: 'Teclas: flechas mover · Intro elegir casilla y luego vecina · Esc cancelar · U deshacer · H pista · R reiniciar · N siguiente',
  },
};
