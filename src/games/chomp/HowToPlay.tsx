import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Que al rival solo le quede <strong>el cuadrado envenenado</strong> (arriba a la
          izquierda).
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Cada ronda empieza con una tableta de 4×5, 4×7, 5×6, 5×8 o 6×7 cuadrados; el primer
            turno se alterna.
          </li>
          <li>
            En tu turno elige un cuadrado y{' '}
            <strong>cómetelo junto con todos los que están debajo y a su derecha</strong>.
          </li>
          <li>No se puede elegir el cuadrado envenenado. Quien deja solo ese cuadrado gana.</li>
          <li>
            Curiosidad: quien empieza siempre tiene una estrategia ganadora (se demuestra «robando»
            la estrategia del rival), aunque no se conoce una fórmula para encontrarla.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca un cuadrado para ver qué te comerías; toca de nuevo o pulsa «Comer» para confirmar.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> elegir / comer, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Leave your opponent nothing but <strong>the poisoned square</strong> (top left).
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Each round starts with a bar of 4×5, 4×7, 5×6, 5×8 or 6×7 squares; the first turn
          alternates.
        </li>
        <li>
          On your turn pick a square and{' '}
          <strong>eat it together with every square below and to its right</strong>.
        </li>
        <li>The poisoned square cannot be picked. Whoever leaves only that square wins.</li>
        <li>
          Fun fact: the first player always has a winning strategy (proved by “stealing” the
          opponent’s strategy), but no formula is known for finding it.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a square to preview the bite; tap again or press “Eat” to confirm.</li>
        <li>
          Arrows, <kbd>Enter</kbd> choose / eat, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
