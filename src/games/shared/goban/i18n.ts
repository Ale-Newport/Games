import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by stone games on an intersection board (Gomoku, Renju, Pente, Go). */
const en: Dictionary = {
  'seat.0': 'Black',
  'seat.1': 'White',
  'menu.name0': 'Black player',
  'menu.name1': 'White player',
  'menu.agent0': 'Black agent',
  'menu.agent1': 'White agent',
  'point.empty': '{point}, empty',
  'point.forbidden': '{point}, forbidden for Black',
  'point.black': '{point}, black stone',
  'point.white': '{point}, white stone',
  'announce.stone': '{seat} played {point}.',
  'touch.confirm': 'Tap again to place',
  keys: 'Keys: arrows move · Enter place · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'seat.0': 'Negras',
  'seat.1': 'Blancas',
  'menu.name0': 'Jugador de negras',
  'menu.name1': 'Jugador de blancas',
  'menu.agent0': 'Agente de negras',
  'menu.agent1': 'Agente de blancas',
  'point.empty': '{point}, vacío',
  'point.forbidden': '{point}, prohibido para negras',
  'point.black': '{point}, piedra negra',
  'point.white': '{point}, piedra blanca',
  'announce.stone': '{seat} jugó en {point}.',
  'touch.confirm': 'Toca otra vez para colocar',
  keys: 'Teclas: flechas mover · Intro colocar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const GOBAN_STRINGS: Record<Locale, Dictionary> = { en, es };
