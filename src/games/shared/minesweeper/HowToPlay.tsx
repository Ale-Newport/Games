import type { Locale } from '../../../core/i18n';

/** Minesweeper rules; the no-guess game adds a line about its boards. */
export function MinesRules({ locale, noGuess }: { locale: Locale; noGuess: boolean }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Abre todas las casillas que no tienen mina. Cada casilla abierta muestra cuántas minas hay
          en sus ocho vecinas; si no hay ninguna, se abren solas las de alrededor. Abrir una mina
          termina la partida.
        </p>
        <p>
          La primera casilla nunca tiene mina, ni sus vecinas.
          {noGuess
            ? ' Además, todos los tableros se pueden despejar razonando desde la primera casilla, sin tener que adivinar nunca.'
            : ' A veces los números no bastan y hay que arriesgar.'}
        </p>
        <h3>Trucos</h3>
        <ul>
          <li>Si un número ya tiene todas sus minas marcadas, sus otras vecinas son seguras.</li>
          <li>Si un número tiene tantas vecinas cerradas como minas le faltan, todas son minas.</li>
          <li>Compara números vecinos: lo que comparten explica lo que les falta.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca para abrir; mantén pulsado, usa el botón derecho o activa «Bandera» para marcar una
          mina. Tocar un número con todas sus banderas abre el resto de sus vecinas. Flechas mover ·{' '}
          <kbd>Espacio</kbd> abrir · <kbd>F</kbd> bandera · <kbd>H</kbd> pista · <kbd>N</kbd> nueva
          partida · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Open every cell that has no mine. Each open cell shows how many mines are among its eight
        neighbours; when there are none, the cells around it open on their own. Opening a mine ends
        the game.
      </p>
      <p>
        The first cell you open, and its neighbours, never hold a mine.
        {noGuess
          ? ' What is more, every board can be cleared by reasoning from the first cell — you never have to guess.'
          : ' Sometimes the numbers are not enough and you have to take a chance.'}
      </p>
      <h3>Tips</h3>
      <ul>
        <li>When a number already has all its mines flagged, its other neighbours are safe.</li>
        <li>When a number has as many closed neighbours as missing mines, they are all mines.</li>
        <li>Compare neighbouring numbers: what they share explains what they still need.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap to open; long-press, right-click or switch on &ldquo;Flag&rdquo; to flag a mine. Tapping
        a number whose mines are all flagged opens its other neighbours. Arrows move ·{' '}
        <kbd>Space</kbd> open · <kbd>F</kbd> flag · <kbd>H</kbd> hint · <kbd>N</kbd> new game ·{' '}
        <kbd>P</kbd> pause.
      </p>
    </>
  );
}
