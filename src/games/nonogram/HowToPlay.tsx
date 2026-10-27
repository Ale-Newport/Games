import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Pinta casillas para descubrir un dibujo. Los números junto a cada fila y sobre cada
          columna son, en orden, las longitudes de los <strong>tramos</strong> de casillas pintadas
          seguidas de esa línea; entre dos tramos hay al menos una casilla vacía. «3 1» significa un
          tramo de tres, un hueco y un tramo de uno.
        </p>
        <p>
          Todos los nonogramas de este juego se resuelven línea a línea, sin adivinar, y tienen una
          única solución. Hay tableros aleatorios de 5×5, 10×10 y 15×15 y una galería de dibujos
          originales.
        </p>
        <h3>Trucos</h3>
        <ul>
          <li>
            Superposición: en una fila de 10 con un tramo de 7, las 4 casillas centrales están
            pintadas se coloque donde se coloque.
          </li>
          <li>Tacha (✕) las casillas que sabes vacías: ayudan tanto como las pintadas.</li>
          <li>Las pistas de una línea ya completa se tachan solas.</li>
          <li>La pista te dice qué línea puede avanzar y cuántas casillas decide.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca o arrastra (en línea recta) para pintar; con «Tachar» marcas vacías (o con el botón
          derecho). Volver a tocar borra. Flechas mover · <kbd>Espacio</kbd> pintar · <kbd>X</kbd>{' '}
          tachar · <kbd>Retroceso</kbd> borrar · <kbd>U</kbd> deshacer · <kbd>R</kbd> rehacer ·{' '}
          <kbd>H</kbd> pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Fill cells to reveal a picture. The numbers beside each row and above each column are, in
        order, the lengths of its <strong>runs</strong> of consecutive filled cells; at least one
        empty cell separates two runs. "3 1" means a run of three, a gap, then a run of one.
      </p>
      <p>
        Every nonogram here can be solved line by line, without guessing, and has exactly one
        solution. There are random 5×5, 10×10 and 15×15 boards and a gallery of original pictures.
      </p>
      <h3>Tips</h3>
      <ul>
        <li>
          Overlap: in a row of 10 with a run of 7, the middle 4 cells are filled wherever it goes.
        </li>
        <li>Cross (✕) cells you know are empty: they help as much as filled ones.</li>
        <li>A line whose clue is satisfied gets its clue struck through.</li>
        <li>A hint tells you which line can move forward and how many cells it decides.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap or drag (in a straight line) to fill; with “Cross” you mark empty cells (or
        right-click). Tapping again clears. Arrows move · <kbd>Space</kbd> fill · <kbd>X</kbd> cross
        · <kbd>Backspace</kbd> clear · <kbd>U</kbd> undo · <kbd>R</kbd> redo · <kbd>H</kbd> hint ·{' '}
        <kbd>P</kbd> pause.
      </p>
    </>
  );
}
