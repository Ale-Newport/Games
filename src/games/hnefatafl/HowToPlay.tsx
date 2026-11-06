import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Defensores</strong>: llevar al rey a una de las cuatro esquinas.{' '}
          <strong>Atacantes</strong>: rodear al rey por sus cuatro lados.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 11×11: 24 atacantes, 12 defensores y el rey en el trono central. Empiezan los
            atacantes.
          </li>
          <li>
            Todas las piezas mueven como una torre: en línea recta, tantas casillas vacías como
            quieras.
          </li>
          <li>
            Solo el rey puede detenerse en el trono o en las esquinas; las demás piezas pueden
            cruzar el trono vacío.
          </li>
          <li>
            Captura: encierra una pieza rival entre dos tuyas en línea (o entre una tuya y una
            esquina o el trono vacío). Meterse entre dos rivales no es una captura. El rey también
            captura.
          </li>
          <li>
            El rey solo cae rodeado por los cuatro lados por atacantes (el trono vacío cuenta como
            uno). En el borde no se le puede capturar.
          </li>
          <li>Quien no puede mover pierde. Triple repetición o 300 jugadas: tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza tuya y luego una casilla marcada.</li>
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
        <strong>Defenders</strong>: bring the king to one of the four corners.{' '}
        <strong>Attackers</strong>: surround the king on all four sides.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          An 11×11 board: 24 attackers, 12 defenders and the king on the central throne. The
          attackers move first.
        </li>
        <li>
          Every piece moves like a rook: in a straight line across any number of empty squares.
        </li>
        <li>
          Only the king may stop on the throne or the corners; other pieces may pass over the empty
          throne.
        </li>
        <li>
          Capture: sandwich an enemy piece in a line between two of yours (or between one of yours
          and a corner or the empty throne). Moving between two enemies is safe. The king captures
          too.
        </li>
        <li>
          The king only falls when attackers close all four sides (the empty throne counts as one).
          He cannot be captured on the edge.
        </li>
        <li>A side with no move loses. Threefold repetition or 300 plies is a draw.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of your pieces, then a marked square.</li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
