import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          La cuadrícula está dividida en tantas regiones de color como filas. Coloca reinas de modo
          que:
        </p>
        <ol>
          <li>Haya exactamente una reina en cada fila y en cada columna.</li>
          <li>Haya exactamente una reina en cada región de color.</li>
          <li>Ninguna reina toque a otra, ni siquiera en diagonal.</li>
        </ol>
        <p>Cada puzle tiene una única solución y se resuelve razonando, sin adivinar.</p>
        <h3>Trucos</h3>
        <ul>
          <li>Si a una fila, columna o región le queda una sola casilla libre, la reina va ahí.</li>
          <li>
            Si una región cabe entera en una fila, el resto de esa fila no puede tener reina (y lo
            mismo con columnas).
          </li>
          <li>Si dos regiones solo caben en dos filas, esas filas son suyas.</li>
          <li>Descarta una casilla si su reina dejaría a otra fila, columna o región sin sitio.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una casilla una vez para ✕ y otra para la reina (o elige «Toque: reina»); arrastra
          para tachar varias. «✕ automática» tacha alrededor de cada reina. Flechas mover ·{' '}
          <kbd>Espacio</kbd> alternar · <kbd>Q</kbd> reina · <kbd>X</kbd> tachar ·{' '}
          <kbd>Retroceso</kbd> borrar · <kbd>U</kbd>/<kbd>R</kbd> deshacer/rehacer · <kbd>H</kbd>{' '}
          pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>The grid is split into as many colored regions as it has rows. Place queens so that:</p>
      <ol>
        <li>Every row and every column has exactly one queen.</li>
        <li>Every colored region has exactly one queen.</li>
        <li>No two queens touch, not even diagonally.</li>
      </ol>
      <p>Every puzzle has a single solution and can be solved by reasoning, without guessing.</p>
      <h3>Tips</h3>
      <ul>
        <li>When a row, column or region has one free cell left, the queen goes there.</li>
        <li>
          When a region fits entirely in one row, the rest of that row cannot hold a queen (columns
          too).
        </li>
        <li>When two regions fit only in two rows, those rows belong to them.</li>
        <li>Rule out a cell if its queen would leave another row, column or region no room.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a cell once for ✕ and again for a queen (or pick “Tap: queen”); drag to cross several
        cells. “Auto ✕” crosses around every queen. Arrows move · <kbd>Space</kbd> cycle ·{' '}
        <kbd>Q</kbd> queen · <kbd>X</kbd> cross · <kbd>Backspace</kbd> clear · <kbd>U</kbd>/
        <kbd>R</kbd> undo/redo · <kbd>H</kbd> hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
