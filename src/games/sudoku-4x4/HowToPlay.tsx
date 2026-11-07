import type { Locale } from '../../core/i18n';
import { SudokuRules } from '../shared/sudoku/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return (
    <SudokuRules
      locale={locale}
      digits="1–4"
      goal={
        locale === 'es' ? (
          <p>
            Rellena la cuadrícula de 4×4 para que cada <strong>fila</strong>, cada{' '}
            <strong>columna</strong> y cada <strong>región</strong> de 2×2 tenga los números 1, 2, 3
            y 4 una sola vez. Truco: busca una casilla en la que solo quepa un número, o un número
            que solo quepa en una casilla de su fila, columna o región.
          </p>
        ) : (
          <p>
            Fill the 4×4 grid so that every <strong>row</strong>, every <strong>column</strong> and
            every 2×2 <strong>box</strong> holds 1, 2, 3 and 4 exactly once. Tip: look for a cell
            where only one digit fits, or a digit that fits in only one cell of its row, column or
            box.
          </p>
        )
      }
    />
  );
}
