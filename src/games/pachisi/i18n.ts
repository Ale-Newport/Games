import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Pachisi',
    'menu.subtitle':
      "India's royal cross-and-circle game: cowrie throws, pieces out on a grace throw, castles to shelter in, and partners on opposite arms who win together.",
    board: 'Pachisi board',
    pick: 'Tap a marked piece to move it.',
    'hint.out': 'Suggested: bring piece {n} in.',
    'hint.move': 'Suggested: move piece {n}.',
    'label.token': '{side} piece {n}',
    keys: 'Keys: R or Space throw · 1–4 move a piece · H hint · Tab and Enter pick a piece',
    roll: 'Throw',
  },
  es: {
    title: 'Pachisi',
    'menu.subtitle':
      'El juego real de la India en cruz: tiradas de cauris, piezas que entran con una tirada de gracia, castillos donde refugiarse y compañeros en brazos opuestos que ganan juntos.',
    board: 'Tablero de pachisi',
    pick: 'Toca una pieza marcada para moverla.',
    'hint.out': 'Sugerencia: entra la pieza {n}.',
    'hint.move': 'Sugerencia: mueve la pieza {n}.',
    'label.token': 'Pieza {n} del {side}',
    keys: 'Teclas: R o Espacio tirar · 1–4 mover una pieza · H pista · Tab y Enter eligen pieza',
    roll: 'Tirar',
  },
};
