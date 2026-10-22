import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser quien <strong>derribe el último bolo</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cada ronda empieza con una fila de 10 a 20 bolos; el primer turno se alterna.</li>
          <li>
            En tu turno derriba <strong>un bolo</strong>, o <strong>dos bolos juntos</strong> (sin
            hueco entre ellos).
          </li>
          <li>Los huecos dividen la fila en grupos independientes.</li>
          <li>Quien derriba el último bolo gana. No hay tablas.</li>
          <li>
            Truco de apertura: quien empieza gana derribando el centro (uno o dos bolos) para dejar
            dos grupos iguales… y después copiando cada jugada del rival en el otro lado.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca un bolo para elegirlo; toca un vecino para elegir los dos. Toca de nuevo o pulsa
            «Derribar» para confirmar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd>, <kbd>Intro</kbd> elegir / confirmar, <kbd>Esc</kbd> cancelar
            · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd>{' '}
            siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the one who <strong>knocks down the last pin</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Each round starts with a row of 10 to 20 pins; the first turn alternates.</li>
        <li>
          On your turn knock down <strong>one pin</strong>, or{' '}
          <strong>two pins side by side</strong> (no gap between them).
        </li>
        <li>Gaps split the row into independent groups.</li>
        <li>Whoever knocks down the last pin wins. There are no draws.</li>
        <li>
          Opening trick: the first player wins by knocking out the middle (one or two pins) to leave
          two equal groups… then mirroring every move on the other side.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a pin to choose it; tap a neighbor to choose both. Tap again or press “Knock down” to
          confirm.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd>, <kbd>Enter</kbd> choose / confirm, <kbd>Esc</kbd> cancel ·{' '}
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
