import type { Locale } from '../../core/i18n';
import { SudokuRules } from '../shared/sudoku/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return (
    <SudokuRules
      locale={locale}
      goal={
        locale === 'es' ? (
          <p>
            Rellena la cuadrícula de 9×9 para que cada <strong>fila</strong>, cada{' '}
            <strong>columna</strong> y cada <strong>región</strong> de 3×3 contenga los números del
            1 al 9 una sola vez.
          </p>
        ) : (
          <p>
            Fill the 9×9 grid so that every <strong>row</strong>, every <strong>column</strong> and
            every 3×3 <strong>box</strong> contains the digits 1 to 9 exactly once.
          </p>
        )
      }
    />
  );
}
