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
            <strong>columna</strong>, cada <strong>región</strong> de 3×3 y también las dos{' '}
            <strong>diagonales</strong> principales (sombreadas) tengan los números del 1 al 9 una
            sola vez. Una casilla del centro está en las dos diagonales a la vez.
          </p>
        ) : (
          <p>
            Fill the 9×9 grid so that every <strong>row</strong>, every <strong>column</strong>,
            every 3×3 <strong>box</strong> and also both main <strong>diagonals</strong> (shaded)
            hold the digits 1 to 9 exactly once. The centre cell lies on both diagonals.
          </p>
        )
      }
    />
  );
}
