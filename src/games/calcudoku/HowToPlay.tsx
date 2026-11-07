import type { Locale } from '../../core/i18n';
import { SudokuRules } from '../shared/sudoku/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return (
    <SudokuRules
      locale={locale}
      digits="1–N"
      goal={
        locale === 'es' ? (
          <>
            <p>
              Rellena la cuadrícula de N×N (de 4×4 a 7×7) con los números del 1 a N, sin repetir
              ninguno en una <strong>fila</strong> ni en una <strong>columna</strong>. No hay
              regiones.
            </p>
            <p>
              Cada <strong>jaula</strong> punteada muestra un resultado y una operación: la suma (+)
              o el producto (×) de sus números, o para dos casillas la resta (−) o la división (÷)
              del mayor entre el menor. Una jaula de una casilla dice directamente su número. Dentro
              de una jaula un número puede repetirse si no está en la misma fila ni columna. Una
              jaula en rojo, ya llena, no da su resultado.
            </p>
          </>
        ) : (
          <>
            <p>
              Fill the N×N grid (from 4×4 to 7×7) with the digits 1 to N, never repeating one in a{' '}
              <strong>row</strong> or a <strong>column</strong>. There are no boxes.
            </p>
            <p>
              Each dashed <strong>cage</strong> shows a target and an operation: the sum (+) or
              product (×) of its digits, or for two cells the difference (−) or quotient (÷) of the
              larger by the smaller. A one-cell cage simply states its digit. A digit may repeat
              inside a cage when the cells are in different rows and columns. A full cage in red
              misses its target.
            </p>
          </>
        )
      }
    />
  );
}
