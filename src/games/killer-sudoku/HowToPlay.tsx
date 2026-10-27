import type { Locale } from '../../core/i18n';
import { SudokuRules } from '../shared/sudoku/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return (
    <SudokuRules
      locale={locale}
      goal={
        locale === 'es' ? (
          <>
            <p>
              Rellena la cuadrícula de 9×9 para que cada <strong>fila</strong>, cada{' '}
              <strong>columna</strong> y cada <strong>región</strong> de 3×3 tenga del 1 al 9 una
              vez. No hay números de partida: la cuadrícula está dividida en <strong>jaulas</strong>{' '}
              punteadas, y el número pequeño de cada jaula es la suma de sus casillas. Dentro de una
              jaula no se repite ningún número.
            </p>
            <p>
              Trucos: una jaula de dos casillas que suma 3 solo puede ser 1 y 2; y como cada fila,
              columna y región suma 45, las jaulas que caben enteras en ellas delatan la casilla que
              queda (la <strong>regla del 45</strong>). Una jaula marcada en rojo repite un número o
              se pasa de su suma.
            </p>
          </>
        ) : (
          <>
            <p>
              Fill the 9×9 grid so that every <strong>row</strong>, <strong>column</strong> and 3×3{' '}
              <strong>box</strong> holds 1 to 9 once. No digits are given: the grid is split into
              dashed <strong>cages</strong>, and the small number in each cage is the sum of its
              cells. No digit repeats inside a cage.
            </p>
            <p>
              Tips: a two-cell cage summing to 3 can only be 1 and 2; and since every row, column
              and box adds up to 45, the cages that fit wholly inside one give away the cell left
              over (the <strong>45 rule</strong>). A cage outlined in red repeats a digit or
              overshoots its sum.
            </p>
          </>
        )
      }
    />
  );
}
