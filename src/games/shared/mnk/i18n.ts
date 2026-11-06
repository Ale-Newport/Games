import type { Dictionary, Locale } from '../../../core/i18n';

/** Board strings shared by the m,n,k games (layered over the two-player shell strings). */
const en: Dictionary = {
  'cell.empty': 'Row {row}, column {col}, empty',
  'cell.x': 'Row {row}, column {col}, X',
  'cell.o': 'Row {row}, column {col}, O',
  'announce.move': '{mark} played row {row}, column {col}.',
};

const es: Dictionary = {
  'cell.empty': 'Fila {row}, columna {col}, vacía',
  'cell.x': 'Fila {row}, columna {col}, X',
  'cell.o': 'Fila {row}, columna {col}, O',
  'announce.move': '{mark} jugó en la fila {row}, columna {col}.',
};

export const MNK_STRINGS: Record<Locale, Dictionary> = { en, es };
