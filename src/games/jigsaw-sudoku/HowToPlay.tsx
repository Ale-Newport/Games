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
            <strong>columna</strong> y cada <strong>región</strong> tenga los números del 1 al 9 una
            sola vez. Aquí las regiones no son cuadrados de 3×3: son figuras irregulares de nueve
            casillas, marcadas con bordes gruesos y colores, y cambian en cada sudoku.
          </p>
        ) : (
          <p>
            Fill the 9×9 grid so that every <strong>row</strong>, every <strong>column</strong> and
            every <strong>region</strong> holds the digits 1 to 9 exactly once. Here the regions are
            not 3×3 squares but irregular nine-cell shapes, outlined in bold and coloured, and they
            change with every puzzle.
          </p>
        )
      }
    />
  );
}
