import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Completar una línea de <strong>cuatro piezas</strong> (fila, columna o diagonal) que
          compartan al menos una característica.
        </p>
        <h3>Piezas</h3>
        <p>
          Hay 16 piezas distintas: altas o bajas (tamaño), oscuras o claras, cuadradas o redondas, y
          huecas (con agujero) o macizas.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>El primer jugador solo elige una pieza para su rival.</li>
          <li>
            Después, en cada turno: <strong>colocas</strong> la pieza que te entregaron en una
            casilla libre y <strong>eliges</strong> la siguiente pieza para tu rival.
          </li>
          <li>
            Gana quien coloca la pieza que completa la línea, aunque sea con una pieza elegida por
            el rival. Si el tablero se llena sin Quarto, es empate. (El aviso verbal de «¡Quarto!»
            es automático.)
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una casilla para colocar y luego una pieza de la reserva para entregarla.</li>
          <li>
            <kbd>Tab</kbd> recorre casillas y piezas · <kbd>Intro</kbd> elegir · <kbd>U</kbd>{' '}
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
        Complete a line of <strong>four pieces</strong> (row, column or diagonal) that share at
        least one trait.
      </p>
      <h3>Pieces</h3>
      <p>
        There are 16 different pieces: tall or short (size), dark or light, square or round, and
        hollow (with a hole) or solid.
      </p>
      <h3>Turn</h3>
      <ul>
        <li>The first player only chooses a piece for the opponent.</li>
        <li>
          From then on, each turn you <strong>place</strong> the piece you were given on an empty
          cell and <strong>choose</strong> the next piece for your opponent.
        </li>
        <li>
          Whoever places the piece that completes a line wins — even a piece the opponent picked. A
          full board without a Quarto is a draw. (Calling “Quarto!” is automatic.)
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a cell to place, then a piece from the pool to hand it over.</li>
        <li>
          <kbd>Tab</kbd> walks cells and pieces · <kbd>Enter</kbd> choose · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
