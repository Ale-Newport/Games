import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Hacer el <strong>último movimiento</strong>: el rival se queda sin capturas y pierde.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 6×6 lleno de piedras blancas y negras en damero. El primer turno se alterna.
          </li>
          <li>
            Mueve una piedra tuya a una casilla vecina (arriba, abajo, izquierda o derecha){' '}
            <strong>ocupada por una piedra rival</strong>, que se elimina.
          </li>
          <li>Nunca se mueve a una casilla vacía.</li>
          <li>Quien no puede mover pierde. No hay tablas.</li>
          <li>
            Consejo: las piedras aisladas no sirven a nadie; piensa en los grupos que quedan al
            final.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una piedra tuya y luego una rival marcada con un anillo rojo.</li>
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
        Make the <strong>last move</strong>: your opponent runs out of captures and loses.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 6×6 board full of white and black stones in a checkerboard. The first turn alternates.
        </li>
        <li>
          Move one of your stones to a neighboring cell (up, down, left or right){' '}
          <strong>holding an enemy stone</strong>, which is removed.
        </li>
        <li>Stones never move onto empty cells.</li>
        <li>Whoever cannot move loses. There are no draws.</li>
        <li>
          Tip: isolated stones are useless to everyone — think about the groups left at the end.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of your stones, then an enemy stone marked with a red ring.</li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
