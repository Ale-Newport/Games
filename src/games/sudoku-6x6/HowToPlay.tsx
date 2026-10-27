import type { Locale } from '../../core/i18n';
import { SudokuRules } from '../shared/sudoku/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return (
    <SudokuRules
      locale={locale}
      digits="1–6"
      goal={
        locale === 'es' ? (
          <p>
            Rellena la cuadrícula de 6×6 para que cada <strong>fila</strong>, cada{' '}
            <strong>columna</strong> y cada <strong>región</strong> de 2×3 (dos filas por tres
            columnas) tenga los números del 1 al 6 una sola vez.
          </p>
        ) : (
          <p>
            Fill the 6×6 grid so that every <strong>row</strong>, every <strong>column</strong> and
            every 2×3 <strong>box</strong> (two rows by three columns) holds the digits 1 to 6
            exactly once.
          </p>
        )
      }
    />
  );
}
