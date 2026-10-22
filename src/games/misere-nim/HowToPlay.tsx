import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Obligar al rival a <strong>tomar la última ficha</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Cada ronda empieza con 3 a 5 montones de 1 a 9 fichas; el primer turno se alterna.
          </li>
          <li>
            En tu turno toma <strong>una o más fichas de un solo montón</strong> (puedes vaciarlo).
          </li>
          <li>Quien toma la última ficha pierde. No hay tablas.</li>
          <li>
            La clave: juega como en el Nim (deja una suma XOR de 0) mientras quede algún montón de 2
            o más. Cuando tu jugada deje solo montones de 1, deja un número <em>impar</em> de ellos.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una ficha: se marcan ella y las de su derecha. Toca de nuevo o pulsa «Tomar» para
            confirmar.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> elegir / confirmar, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Force your opponent to <strong>take the last counter</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Each round starts with 3 to 5 heaps of 1 to 9 counters; the first turn alternates.</li>
        <li>
          On your turn take <strong>one or more counters from a single heap</strong> (you may empty
          it).
        </li>
        <li>Whoever takes the last counter loses. There are no draws.</li>
        <li>
          The key: play as in Nim (leave an XOR of 0) while some heap has 2 or more counters. When
          your move leaves only heaps of 1, leave an <em>odd</em> number of them.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a counter: it and the ones to its right are marked. Tap again or press “Take” to
          confirm.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> choose / confirm, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
