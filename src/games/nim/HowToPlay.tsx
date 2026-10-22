import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser quien <strong>tome la última ficha</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Cada ronda empieza con 3 a 5 montones de 1 a 9 fichas; el primer turno se alterna.
          </li>
          <li>
            En tu turno toma <strong>una o más fichas de un solo montón</strong> (puedes vaciarlo).
          </li>
          <li>Quien toma la última ficha gana. No hay tablas.</li>
          <li>
            La clave: escribe cada montón en binario y suma sin acarreo (XOR). Si el resultado es 0
            tras tu jugada, el rival está perdido con juego perfecto.
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
        Be the one who <strong>takes the last counter</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Each round starts with 3 to 5 heaps of 1 to 9 counters; the first turn alternates.</li>
        <li>
          On your turn take <strong>one or more counters from a single heap</strong> (you may empty
          it).
        </li>
        <li>Whoever takes the last counter wins. There are no draws.</li>
        <li>
          The key: write each heap in binary and add without carrying (XOR). If the result is 0
          after your move, your opponent is lost against perfect play.
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
