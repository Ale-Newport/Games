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
          <li>Cada ronda empieza con dos montones de 4 a 15 fichas; el primer turno se alterna.</li>
          <li>
            En tu turno toma <strong>fichas de un solo montón</strong> (las que quieras), o{' '}
            <strong>el mismo número de ambos</strong>.
          </li>
          <li>Quien toma la última ficha gana. No hay tablas.</li>
          <li>
            La clave: los pares perdedores para quien mueve son (0,0), (1,2), (3,5), (4,7), (6,10),
            (8,13)… — el n-ésimo par es (⌊n·φ⌋, ⌊n·φ⌋ + n), con φ la razón áurea.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una ficha para marcar cuántas tomar; activa «De ambos montones» para la jugada
            doble. Toca de nuevo o pulsa «Tomar» para confirmar.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> elegir / confirmar, <kbd>B</kbd> ambos montones,{' '}
            <kbd>Esc</kbd> cancelar · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd>{' '}
            reiniciar · <kbd>N</kbd> siguiente.
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
        <li>Each round starts with two heaps of 4 to 15 counters; the first turn alternates.</li>
        <li>
          On your turn take <strong>counters from one heap</strong> (as many as you like), or{' '}
          <strong>the same number from both</strong>.
        </li>
        <li>Whoever takes the last counter wins. There are no draws.</li>
        <li>
          The key: the pairs that lose for the player to move are (0,0), (1,2), (3,5), (4,7),
          (6,10), (8,13)… — the n-th pair is (⌊n·φ⌋, ⌊n·φ⌋ + n), with φ the golden ratio.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a counter to mark how many to take; switch on “From both heaps” for the double move.
          Tap again or press “Take” to confirm.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> choose / confirm, <kbd>B</kbd> both heaps, <kbd>Esc</kbd> cancel
          · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
