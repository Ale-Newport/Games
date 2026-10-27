import type { Locale } from '../../core/i18n';
import { SudokuRules } from '../shared/sudoku/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return (
    <SudokuRules
      locale={locale}
      digits="1–9, A–G"
      goal={
        locale === 'es' ? (
          <p>
            Rellena la cuadrícula de 16×16 para que cada <strong>fila</strong>, cada{' '}
            <strong>columna</strong> y cada <strong>región</strong> de 4×4 tenga los dieciséis
            símbolos una sola vez: del 1 al 9 y las letras de la A a la G (A = 10 … G = 16). En el
            teclado, las letras se escriben con <kbd>A</kbd>–<kbd>G</kbd>.
          </p>
        ) : (
          <p>
            Fill the 16×16 grid so that every <strong>row</strong>, every <strong>column</strong>{' '}
            and every 4×4 <strong>box</strong> holds the sixteen symbols exactly once: 1 to 9 and
            the letters A to G (A = 10 … G = 16). On a keyboard, type the letters with <kbd>A</kbd>–
            <kbd>G</kbd>.
          </p>
        )
      }
    />
  );
}
