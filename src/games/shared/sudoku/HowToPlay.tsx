import type { ReactNode } from 'react';
import type { Locale } from '../../../core/i18n';

/** The rules every sudoku shares: notes, hints, controls. Each game adds its own goal. */
export function SudokuRules({
  locale,
  goal,
  digits = '1–9',
}: {
  locale: Locale;
  goal: ReactNode;
  digits?: string;
}) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        {goal}
        <p>Cada sudoku tiene una única solución, a la que se llega razonando, sin adivinar.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Elige una casilla y toca un número ({digits}) para colocarlo; tócalo otra vez para
            quitarlo.
          </li>
          <li>
            Con <strong>Notas</strong> activas (o Mayús+número) apuntas candidatos pequeños. Al
            colocar un número se borra de las notas de su fila, columna y región.
          </li>
          <li>
            Los números repetidos se marcan siempre; con «Mostrar errores» también los que no
            coinciden con la solución.
          </li>
          <li>
            La <strong>pista</strong> explica el siguiente paso (único candidato, único lugar, y las
            técnicas previas que hagan falta) y lo coloca si quieres.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas mover · números colocar · <kbd>Mayús</kbd>+número o <kbd>N</kbd> notas ·{' '}
          <kbd>Retroceso</kbd> borrar · <kbd>U</kbd> deshacer · <kbd>R</kbd> rehacer · <kbd>H</kbd>{' '}
          pista · <kbd>Intro</kbd> colocar la pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      {goal}
      <p>Every puzzle has exactly one solution, reachable by reasoning, without guessing.</p>
      <h3>How to play</h3>
      <ul>
        <li>Pick a cell and tap a digit ({digits}) to place it; tap it again to remove it.</li>
        <li>
          With <strong>Notes</strong> on (or Shift+digit) you pencil in small candidates. Placing a
          digit removes it from the notes of its row, column and box.
        </li>
        <li>
          Repeated digits are always marked; with &ldquo;Show mistakes&rdquo; so are digits that
          differ from the solution.
        </li>
        <li>
          A <strong>hint</strong> explains the next step (a naked or hidden single, plus any
          technique needed first) and fills it in if you want.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows move · digits place · <kbd>Shift</kbd>+digit or <kbd>N</kbd> notes ·{' '}
        <kbd>Backspace</kbd> erase · <kbd>U</kbd> undo · <kbd>R</kbd> redo · <kbd>H</kbd> hint ·{' '}
        <kbd>Enter</kbd> fill the hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
