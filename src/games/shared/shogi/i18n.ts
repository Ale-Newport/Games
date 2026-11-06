import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the shogi family (board, hands, promotion, results). */
const en: Dictionary = {
  'seat.0': 'Sente',
  'seat.1': 'Gote',
  'menu.name0': 'Sente player',
  'menu.name1': 'Gote player',
  'menu.agent0': 'Sente agent',
  'menu.agent1': 'Gote agent',
  'board.label': 'Board',
  'sq.empty': 'empty',
  'sq.selected': 'selected',
  'sq.target': 'move here',
  'sq.capture': 'capture here',
  'sq.check': 'in check',
  'hand.label': 'Pieces in hand of {seat}',
  'hand.empty': 'No pieces in hand',
  'promo.title': 'Promote this piece?',
  'promo.yes': 'Promote',
  'promo.no': 'Keep',
  'moves.label': 'Moves',
  'moves.none': 'No moves yet',
  'announce.move': '{seat}: {move}.',
  'info.check': 'Check!',
  'result.checkmate': 'Checkmate.',
  'result.noMoves': '{seat} has no legal move and loses.',
  'result.capture': '{seat} captured the {royal}.',
  'result.try': "{seat}'s {royal} reached the far row safely.",
  'result.perpetual': 'Perpetual check is not allowed: {seat} loses.',
  'result.repetition': 'Draw by repetition.',
  'result.moveLimit': 'Draw: the move limit was reached.',
  keys: 'Keys: arrows move · Enter select / move · Esc cancel · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'seat.0': 'Sente',
  'seat.1': 'Gote',
  'menu.name0': 'Jugador sente',
  'menu.name1': 'Jugador gote',
  'menu.agent0': 'Agente sente',
  'menu.agent1': 'Agente gote',
  'board.label': 'Tablero',
  'sq.empty': 'vacía',
  'sq.selected': 'seleccionada',
  'sq.target': 'mover aquí',
  'sq.capture': 'capturar aquí',
  'sq.check': 'en jaque',
  'hand.label': 'Piezas en mano de {seat}',
  'hand.empty': 'Sin piezas en mano',
  'promo.title': '¿Promocionar esta pieza?',
  'promo.yes': 'Promocionar',
  'promo.no': 'Mantener',
  'moves.label': 'Jugadas',
  'moves.none': 'Aún no hay jugadas',
  'announce.move': '{seat}: {move}.',
  'info.check': '¡Jaque!',
  'result.checkmate': 'Jaque mate.',
  'result.noMoves': '{seat} no tiene jugadas legales y pierde.',
  'result.capture': '{seat} capturó al {royal}.',
  'result.try': 'El {royal} de {seat} llegó a salvo a la última fila.',
  'result.perpetual': 'El jaque perpetuo no está permitido: pierde {seat}.',
  'result.repetition': 'Tablas por repetición.',
  'result.moveLimit': 'Tablas: se alcanzó el límite de jugadas.',
  keys: 'Teclas: flechas mover · Intro seleccionar / mover · Esc cancelar · U deshacer · H pista · R reiniciar · N siguiente',
};

export const SHOGI_STRINGS: Record<Locale, Dictionary> = { en, es };

/**
 * Accessible piece names ("pc.<owner>.<letter>", promoted letters as "p<letter>") from
 * `names[letter] = [english, spanish]`, e.g. "Sente rook" / "torre de sente".
 */
export function pieceStrings(names: Record<string, [string, string]>): Record<Locale, Dictionary> {
  const out: Record<Locale, Dictionary> = { en: {}, es: {} };
  for (const [letter, [enName, esName]] of Object.entries(names))
    for (const owner of [0, 1] as const) {
      const key = `pc.${owner}.${letter.replace('+', 'p')}`;
      const seat = owner === 0 ? 'Sente' : 'Gote';
      out.en[key] = `${seat} ${enName}`;
      out.es[key] = `${esName} de ${seat.toLowerCase()}`;
    }
  return out;
}
