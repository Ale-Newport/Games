import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Forma <strong>cuatro en línea</strong> (fila, columna o diagonal) o un{' '}
          <strong>cuadrado</strong> de 2×2 con tus cuatro fichas.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Negras empiezan. Primero, por turnos, cada uno coloca sus cuatro fichas en casillas
            vacías.
          </li>
          <li>
            Después, cada turno mueve una ficha propia a una casilla vecina vacía (en cualquiera de
            las 8 direcciones).
          </li>
          <li>Triple repetición o 200 jugadas: tablas. Con juego perfecto, el Teeko es tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una casilla para colocar; para mover, toca tu ficha y luego el destino.</li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / colocar, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Make <strong>four in a row</strong> (row, column or diagonal) or a 2×2{' '}
        <strong>square</strong> with your four markers.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Black starts. First the players take turns dropping their four markers on empty cells.
        </li>
        <li>Then each turn moves one marker to an empty neighboring cell (any of 8 directions).</li>
        <li>Threefold repetition or 200 plies: draw. With perfect play Teeko is a draw.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a cell to drop; to move, tap your marker and then its destination.</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / drop, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
