import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Da <strong>jaque mate</strong>, como en el ajedrez normal. Solo cambia la posición
          inicial.
        </p>
        <h3>Posición inicial</h3>
        <ul>
          <li>
            Los peones están en su sitio, pero las piezas de la primera fila se barajan: los alfiles
            en casillas de distinto color y el rey entre las dos torres. Negras copian la
            disposición de blancas en espejo. Hay 960 posiciones posibles; la n.º 518 es la clásica.
          </li>
          <li>Cada ronda nueva sortea una posición; «Reiniciar» repite la misma.</li>
        </ul>
        <h3>Enroque 960</h3>
        <ul>
          <li>
            Tras enrocar, el rey y la torre quedan en las mismas casillas que en el ajedrez clásico:
            corto, rey en g1 y torre en f1; largo, rey en c1 y torre en d1 (g8/f8 y c8/d8 para
            negras).
          </li>
          <li>
            Ni el rey ni esa torre se han movido; todas las casillas que recorren deben estar vacías
            (salvo el propio rey y la torre); el rey no puede estar en jaque ni pasar por una
            casilla atacada ni terminar en ella.
          </li>
          <li>
            Para enrocar, toca el rey y luego <strong>su torre</strong> (o arrástralo sobre ella).
          </li>
        </ul>
        <h3>Resto de reglas</h3>
        <p>
          Idénticas al ajedrez: al paso, coronación, ahogado, triple repetición, 50 jugadas,
          material insuficiente, relojes y rendición.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza y luego su destino, o arrástrala.</li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / mover, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Deliver <strong>checkmate</strong>, as in normal chess. Only the starting position changes.
      </p>
      <h3>Start position</h3>
      <ul>
        <li>
          Pawns stand as usual, but the back-rank pieces are shuffled: bishops on opposite colors
          and the king between the two rooks. Black mirrors White. There are 960 possible setups;
          number 518 is the classical one.
        </li>
        <li>Each new round draws a position; “Restart” replays the same one.</li>
      </ul>
      <h3>Chess960 castling</h3>
      <ul>
        <li>
          After castling the king and rook stand where they would in classical chess: short — king
          g1, rook f1; long — king c1, rook d1 (g8/f8 and c8/d8 for Black).
        </li>
        <li>
          Neither the king nor that rook has moved; every square either one travels over must be
          empty (apart from the king and rook themselves); the king may not be in check, pass
          through or land on an attacked square.
        </li>
        <li>
          To castle, tap the king and then <strong>its rook</strong> (or drag the king onto it).
        </li>
      </ul>
      <h3>Everything else</h3>
      <p>
        Same as chess: en passant, promotion, stalemate, threefold repetition, fifty moves,
        insufficient material, clocks and resignation.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>Tap a piece, then its destination, or drag it.</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
