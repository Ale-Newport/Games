import type { Dictionary, Locale } from '../../../core/i18n';

const en: Dictionary = {
  'sq.empty': 'Square {n}, empty',
  'sq.man0': 'Square {n}, {seat0} man',
  'sq.king0': 'Square {n}, {seat0} king',
  'sq.man1': 'Square {n}, {seat1} man',
  'sq.king1': 'Square {n}, {seat1} king',
  'sq.movable': 'can move',
  'sq.target': 'move here',
  'announce.move': '{seat} played {move}.',
  'info.pieces': '{seat0} {a} · {seat1} {b}',
  'result.noMoves': '{seat} has no pieces or moves left.',
  'result.repetition': 'Draw by threefold repetition.',
  'result.noProgress': 'Draw: no capture or man move for too long.',
  'result.endgame': 'Draw by the endgame move count.',
  keys: 'Keys: arrows move · Enter select / step · Esc cancel · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'sq.empty': 'Casilla {n}, vacía',
  'sq.man0': 'Casilla {n}, peón {seat0}',
  'sq.king0': 'Casilla {n}, dama {seat0}',
  'sq.man1': 'Casilla {n}, peón {seat1}',
  'sq.king1': 'Casilla {n}, dama {seat1}',
  'sq.movable': 'puede mover',
  'sq.target': 'mover aquí',
  'announce.move': '{seat} jugó {move}.',
  'info.pieces': '{seat0} {a} · {seat1} {b}',
  'result.noMoves': '{seat} se ha quedado sin piezas o sin jugadas.',
  'result.repetition': 'Tablas por triple repetición.',
  'result.noProgress': 'Tablas: demasiado tiempo sin capturas ni movimientos de peón.',
  'result.endgame': 'Tablas por la cuenta de jugadas del final.',
  keys: 'Teclas: flechas mover · Intro seleccionar / paso · Esc cancelar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const DRAUGHTS_STRINGS: Record<Locale, Dictionary> = { en, es };
