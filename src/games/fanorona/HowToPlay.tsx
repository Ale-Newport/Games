import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Capturar <strong>todas las piezas rivales</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 5×9 puntos unidos por líneas; 22 piezas por bando y el centro vacío. Empiezan
            las blancas.
          </li>
          <li>
            Una pieza se mueve un paso a lo largo de una línea a un punto vacío (las diagonales solo
            existen donde están dibujadas).
          </li>
          <li>
            <strong>Aproximación</strong>: si al moverte quedas junto a una pieza rival en la
            dirección del movimiento, la capturas junto con la fila rival continua detrás de ella.{' '}
            <strong>Retirada</strong>: si te alejas de una pieza rival vecina, capturas esa pieza y
            su fila. Si ambas son posibles, eliges una.
          </li>
          <li>
            Capturar es obligatorio. Solo puedes mover sin capturar si no hay ninguna captura.
          </li>
          <li>
            Tras capturar puedes seguir capturando con la misma pieza, pero sin repetir dirección
            seguida ni volver a un punto ya visitado en ese turno. Puedes parar cuando quieras.
          </li>
          <li>
            Gana quien captura todo (o deja al rival sin jugadas). Triple repetición o 30 turnos sin
            capturas: tablas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una pieza y un destino (punto verde). Si hay dos capturas posibles, elige con los
            botones; las piezas que caerían se marcan.
          </li>
          <li>Durante una cadena, sigue tocando destinos o pulsa «Terminar el turno».</li>
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
        Capture <strong>every enemy piece</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 5×9 board of points joined by lines; 22 pieces each with the center empty. White starts.
        </li>
        <li>
          A piece moves one step along a line to an empty point (diagonals exist only where drawn).
        </li>
        <li>
          <strong>Approach</strong>: if your move ends next to an enemy piece in the direction of
          travel, you capture it and the unbroken enemy line behind it. <strong>Withdrawal</strong>:
          if you move straight away from an adjacent enemy piece, you capture it and its line. If
          both are possible, you choose.
        </li>
        <li>
          Capturing is compulsory. You may only move without capturing when no capture exists.
        </li>
        <li>
          After a capture you may keep capturing with the same piece, but not in the same direction
          twice in a row and not back onto a point visited this turn. You may stop at any time.
        </li>
        <li>
          Capture everything (or leave your opponent without a move) to win. Threefold repetition or
          30 turns without a capture is a draw.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a piece and a destination (green dot). If two captures are possible, pick one with the
          buttons; the pieces that would fall are marked.
        </li>
        <li>During a chain, keep tapping destinations or press “End the turn”.</li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
