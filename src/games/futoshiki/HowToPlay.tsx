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
              ninguno en una <strong>fila</strong> ni en una <strong>columna</strong>.
            </p>
            <p>
              Los <strong>signos</strong> entre dos casillas vecinas (‹, ›, ∧, ∨) se cumplen: la
              punta señala siempre el número menor. Algunos números pueden venir dados. Un signo en
              rojo no se cumple con los números puestos.
            </p>
          </>
        ) : (
          <>
            <p>
              Fill the N×N grid (from 4×4 to 7×7) with the digits 1 to N, never repeating one in a{' '}
              <strong>row</strong> or a <strong>column</strong>.
            </p>
            <p>
              Every <strong>sign</strong> between two neighbouring cells (‹, ›, ∧, ∨) holds: its
              point always faces the smaller digit. A few digits may be given. A sign in red is
              broken by the digits placed.
            </p>
          </>
        )
      }
    />
  );
}
