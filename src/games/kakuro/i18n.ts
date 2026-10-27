import type { Dictionary, Locale } from '../../core/i18n';
import { SUDOKU_STRINGS } from '../shared/sudoku/i18n';

const KAKURO: Record<Locale, Dictionary> = {
  en: {
    title: 'Kakuro',
    'menu.subtitle':
      'A crossword of numbers: fill the white cells with 1–9 so each run adds up to its clue, without repeating a digit in a run.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.easy.hint': 'A 6×6 board, runs of up to 5.',
    'difficulty.medium.hint': 'A 7×7 board, runs of up to 6.',
    'difficulty.hard.hint': 'An 8×8 board with more runs to cross.',
    across: 'across',
    down: 'down',
    'combo.line': '{dir} {sum} in {n}: {sets}',
    'combo.none': 'no combination left',
    'hint.single':
      '{cell} can only be {digit}: it is the one digit both its across {across} and its down {down} still allow.',
    'hint.hidden': 'The {dir} {sum} must use a {digit}, and only {cell} can take it.',
    'tech.run-combination': 'run combinations',
    'tech.single': 'single',
    'tech.hidden-single': 'hidden single',
    'run.label': '{dir} clue {sum}',
    'clue.label': 'Clue: {parts}',
  },
  es: {
    title: 'Kakuro',
    'menu.subtitle':
      'Un crucigrama de números: rellena las casillas blancas con 1–9 para que cada tramo sume su pista, sin repetir número dentro de un tramo.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.easy.hint': 'Tablero de 6×6, tramos de hasta 5.',
    'difficulty.medium.hint': 'Tablero de 7×7, tramos de hasta 6.',
    'difficulty.hard.hint': 'Tablero de 8×8 con más tramos que cruzar.',
    across: 'horizontal',
    down: 'vertical',
    'combo.line': '{dir} {sum} en {n}: {sets}',
    'combo.none': 'no queda ninguna combinación',
    'hint.single':
      '{cell} solo puede ser {digit}: es el único número que admiten a la vez su horizontal {across} y su vertical {down}.',
    'hint.hidden': 'La {dir} de {sum} necesita un {digit}, y solo {cell} puede llevarlo.',
    'tech.run-combination': 'combinaciones de tramo',
    'tech.single': 'único',
    'tech.hidden-single': 'único oculto',
    'run.label': 'pista {dir} {sum}',
    'clue.label': 'Pista: {parts}',
  },
};

export const STRINGS: Record<Locale, Dictionary> = {
  en: { ...SUDOKU_STRINGS.en, ...KAKURO.en },
  es: { ...SUDOKU_STRINGS.es, ...KAKURO.es },
};
