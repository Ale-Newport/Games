import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser quien <strong>coloque la última ficha</strong>: el rival se queda sin sitio y pierde.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cuadrícula de 8×8. Azul solo coloca fichas en vertical; Naranja, en horizontal.</li>
          <li>
            Cada ficha cubre dos casillas vacías vecinas. El primer turno se alterna por ronda.
          </li>
          <li>Quien no puede colocar ninguna ficha en su turno pierde. No hay tablas.</li>
          <li>
            Consejo: guarda huecos que solo tú puedas usar (por ejemplo, dos casillas apiladas entre
            fichas del rival si juegas en vertical).
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una casilla y luego la vecina resaltada en verde. Si solo hay una posible, toca la
            misma casilla otra vez.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the one to <strong>place the last domino</strong>: your opponent runs out of room and
        loses.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>An 8×8 grid. Blue only places vertical dominoes; Orange only horizontal ones.</li>
        <li>Each domino covers two empty neighboring cells. The first turn alternates by round.</li>
        <li>Whoever cannot place a domino on their turn loses. There are no draws.</li>
        <li>
          Tip: keep spots only you can use (for instance, two stacked cells between your opponent’s
          dominoes when you play vertically).
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a cell, then the neighbor highlighted in green. If only one fits, tap the same cell
          again.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
