import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Defensores</strong>: llevar al rey a cualquier casilla del borde.{' '}
          <strong>Atacantes</strong>: capturar al rey.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 9×9: 16 atacantes, 8 defensores y el rey en el trono central. Empiezan los
            atacantes.
          </li>
          <li>Todas las piezas mueven como una torre. Solo el rey puede detenerse en el trono.</li>
          <li>
            Captura: encierra una pieza rival entre dos tuyas en línea (o contra el trono vacío).
            Meterse entre dos rivales no es una captura. El rey también captura.
          </li>
          <li>
            El rey cae rodeado por cuatro atacantes en el trono, por tres más el trono si está a su
            lado, y en cualquier otro sitio encerrado entre dos atacantes, como una pieza normal.
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
        <strong>Defenders</strong>: bring the king to any edge square. <strong>Attackers</strong>:
        capture the king.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 9×9 board: 16 attackers, 8 defenders and the king on the central throne. The attackers
          move first.
        </li>
        <li>Every piece moves like a rook. Only the king may stop on the throne.</li>
        <li>
          Capture: sandwich an enemy piece in a line between two of yours (or against the empty
          throne). Moving between two enemies is safe. The king captures too.
        </li>
        <li>
          The king falls to four attackers on the throne, three plus the throne when next to it, and
          anywhere else when sandwiched between two attackers like any piece.
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
