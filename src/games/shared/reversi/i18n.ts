import type { Dictionary, Locale } from '../../../core/i18n';

const en: Dictionary = {
  'seat.0': 'Black',
  'seat.1': 'White',
  'menu.name0': 'Black player',
  'menu.name1': 'White player',
  'menu.agent0': 'Black agent',
  'menu.agent1': 'White agent',
  'square.empty': '{square}, empty',
  'square.legal': '{square}, empty, legal move',
  'square.black': '{square}, black',
  'square.white': '{square}, white',
  'pass.none': 'No legal moves.',
  'pass.button': 'Pass',
  'announce.place': '{seat} played {square}, flipping {n}.',
  'announce.pass': '{seat} passed.',
  'info.discs': 'Black {b} · White {w}',
  'result.discs': 'Final count — Black {b} · White {w}',
  keys: 'Keys: arrows move · Enter place · P pass · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'seat.0': 'Negras',
  'seat.1': 'Blancas',
  'menu.name0': 'Jugador de negras',
  'menu.name1': 'Jugador de blancas',
  'menu.agent0': 'Agente de negras',
  'menu.agent1': 'Agente de blancas',
  'square.empty': '{square}, vacía',
  'square.legal': '{square}, vacía, jugada legal',
  'square.black': '{square}, negra',
  'square.white': '{square}, blanca',
  'pass.none': 'No hay jugadas legales.',
  'pass.button': 'Pasar',
  'announce.place': '{seat} jugó en {square} y volteó {n}.',
  'announce.pass': '{seat} pasó.',
  'info.discs': 'Negras {b} · Blancas {w}',
  'result.discs': 'Recuento final — Negras {b} · Blancas {w}',
  keys: 'Teclas: flechas mover · Intro colocar · P pasar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const REVERSI_STRINGS: Record<Locale, Dictionary> = { en, es };
