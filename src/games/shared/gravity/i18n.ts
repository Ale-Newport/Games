import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the gravity games (layered over the two-player shell strings). */
const en: Dictionary = {
  'seat.0': 'Red',
  'seat.1': 'Yellow',
  'menu.name0': 'Red player',
  'menu.name1': 'Yellow player',
  'menu.agent0': 'Red agent',
  'menu.agent1': 'Yellow agent',
  'column.label': 'Column {n}, {free} free',
  'column.full': 'Column {n}, full',
  'announce.drop': '{seat} dropped in column {n}.',
  keys: 'Keys: ←/→ choose column · ↓/Enter drop · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'seat.0': 'Rojo',
  'seat.1': 'Amarillo',
  'menu.name0': 'Jugador rojo',
  'menu.name1': 'Jugador amarillo',
  'menu.agent0': 'Agente rojo',
  'menu.agent1': 'Agente amarillo',
  'column.label': 'Columna {n}, {free} libres',
  'column.full': 'Columna {n}, llena',
  'announce.drop': '{seat} soltó en la columna {n}.',
  keys: 'Teclas: ←/→ elegir columna · ↓/Intro soltar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const GRAVITY_STRINGS: Record<Locale, Dictionary> = { en, es };
