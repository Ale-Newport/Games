import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sombrea casillas de la cuadrícula numerada hasta que se cumplan las tres reglas:</p>
        <ol>
          <li>Ningún número se repite entre las casillas blancas de una fila o columna.</li>
          <li>Dos casillas sombreadas nunca se tocan por un lado (en diagonal sí).</li>
          <li>Todas las casillas blancas forman una sola zona unida.</li>
        </ol>
        <p>
          Solo se sombrea una casilla cuyo número se repite en su fila o columna. Cada hitori tiene
          una única solución.
        </p>
        <h3>Trucos</h3>
        <ul>
          <li>Junto a una sombreada, las cuatro vecinas son blancas.</li>
          <li>En «A B A», la B queda blanca: una de las A se sombrea seguro.</li>
          <li>
            Si dos números iguales están juntos, uno queda blanco: los demás iguales de esa línea se
            sombrean.
          </li>
          <li>Nunca sombrees una casilla que dejaría parte de las blancas aislada.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una casilla para sombrearla, otra vez para marcarla como blanca (con un círculo) y
          otra para borrarla; o elige «Sombrear» / «Mantener». Flechas mover · <kbd>Espacio</kbd>{' '}
          sombrear · <kbd>K</kbd> mantener · <kbd>Retroceso</kbd> borrar · <kbd>U</kbd> deshacer ·{' '}
          <kbd>R</kbd> rehacer · <kbd>H</kbd> pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Shade cells of the numbered grid until all three rules hold:</p>
      <ol>
        <li>No number repeats among the white cells of a row or column.</li>
        <li>Two shaded cells never touch side by side (diagonally is fine).</li>
        <li>All the white cells form one connected area.</li>
      </ol>
      <p>
        Only a cell whose number repeats in its row or column is ever shaded. Every puzzle has
        exactly one solution.
      </p>
      <h3>Tips</h3>
      <ul>
        <li>Next to a shaded cell, all four neighbours are white.</li>
        <li>In “A B A”, B stays white: one of the A’s is surely shaded.</li>
        <li>
          When two equal numbers sit side by side, one stays white: shade every other copy in that
          line.
        </li>
        <li>Never shade a cell that would cut off part of the white area.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a cell to shade it, again to mark it kept (a circle), again to clear it; or pick “Shade”
        / “Keep”. Arrows move · <kbd>Space</kbd> shade · <kbd>K</kbd> keep · <kbd>Backspace</kbd>{' '}
        clear · <kbd>U</kbd> undo · <kbd>R</kbd> redo · <kbd>H</kbd> hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
