import type { Dictionary, Locale } from '../../../core/i18n';

const en: Dictionary = {
  'seat.0': 'Red',
  'seat.1': 'Blue',
  'menu.name0': 'Red player (top–bottom)',
  'menu.name1': 'Blue player (left–right)',
  'menu.agent0': 'Red agent',
  'menu.agent1': 'Blue agent',
  'cell.empty': 'empty',
  'cell.red': 'red stone',
  'cell.blue': 'blue stone',
  'action.swap': 'Swap (take Red’s first stone)',
  'announce.stone': '{seat} played {cell}.',
  'announce.swap': 'Blue swapped and took the first stone.',
  'info.goal': 'Red joins top and bottom · Blue joins left and right',
  'info.swap': 'Blue may swap instead of moving',
  'result.connected': '{seat} connected their sides in {n} stones.',
  keys: 'Keys: arrows move · Enter place · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'seat.0': 'Rojo',
  'seat.1': 'Azul',
  'menu.name0': 'Jugador rojo (arriba–abajo)',
  'menu.name1': 'Jugador azul (izquierda–derecha)',
  'menu.agent0': 'Agente rojo',
  'menu.agent1': 'Agente azul',
  'cell.empty': 'vacía',
  'cell.red': 'piedra roja',
  'cell.blue': 'piedra azul',
  'action.swap': 'Intercambiar (quedarse la primera piedra roja)',
  'announce.stone': '{seat} jugó en {cell}.',
  'announce.swap': 'Azul intercambió y se quedó la primera piedra.',
  'info.goal': 'Rojo une arriba y abajo · Azul une izquierda y derecha',
  'info.swap': 'Azul puede intercambiar en lugar de jugar',
  'result.connected': '{seat} unió sus lados con {n} piedras.',
  keys: 'Teclas: flechas mover · Intro colocar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const HEX_STRINGS: Record<Locale, Dictionary> = { en, es };
