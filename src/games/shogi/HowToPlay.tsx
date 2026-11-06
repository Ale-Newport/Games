import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Da <strong>jaque mate</strong> al rey rival. Sente (abajo, ☗) mueve primero.
        </p>
        <h3>Piezas</h3>
        <ul>
          <li>
            <strong>Rey</strong> (玉/王): una casilla en cualquier dirección. <strong>Torre</strong>{' '}
            (飛): en línea recta. <strong>Alfil</strong> (角): en diagonal.
          </li>
          <li>
            <strong>Oro</strong> (金): una casilla en ortogonal o en diagonal hacia delante.{' '}
            <strong>Plata</strong> (銀): una casilla en diagonal o recto hacia delante.
          </li>
          <li>
            <strong>Caballo</strong> (桂): salta dos adelante y una al lado, solo hacia delante.{' '}
            <strong>Lanza</strong> (香): recto hacia delante cualquier distancia.{' '}
            <strong>Peón</strong> (歩): una casilla hacia delante y captura igual.
          </li>
        </ul>
        <h3>Promoción</h3>
        <ul>
          <li>
            Las tres filas más lejanas son la zona de promoción. Al entrar, salir o moverse dentro
            de ella, una pieza puede promocionar (se muestra en rojo): torre → dragón (añade un paso
            en diagonal), alfil → caballo dragón (añade un paso en ortogonal), plata, caballo, lanza
            y peón → mueven como el oro. Rey y oro no promocionan.
          </li>
          <li>
            La promoción es obligatoria si la pieza ya no podría moverse: peón y lanza en la última
            fila, caballo en las dos últimas.
          </li>
        </ul>
        <h3>Lanzamientos</h3>
        <ul>
          <li>
            Las piezas capturadas pasan a tu mano y, en lugar de mover, puedes colocar una en
            cualquier casilla vacía (sin promocionar).
          </li>
          <li>
            No se puede lanzar una pieza donde no podría moverse, ni un peón en una columna donde ya
            tienes otro peón sin promocionar (<em>nifu</em>), ni dar mate con un peón lanzado (
            <em>uchifuzume</em>).
          </li>
        </ul>
        <h3>Fin de la partida</h3>
        <ul>
          <li>Jaque mate gana; quien no tiene jugadas legales pierde.</li>
          <li>
            Si la misma posición (con las manos y el turno) se repite cuatro veces es tablas (
            <em>sennichite</em>), salvo que un bando diera jaque en todas sus jugadas: ese bando
            pierde.
          </li>
          <li>
            Límite de 512 jugadas: tablas (el recuento por puntos de los reyes entrados no está
            implementado).
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una pieza y luego su destino. Para lanzar, toca la pieza en tu mano y luego la
            casilla. Si la promoción es opcional, eliges «Promocionar» o «Mantener».
          </li>
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
        <strong>Checkmate</strong> the enemy king. Sente (bottom, ☗) moves first.
      </p>
      <h3>Pieces</h3>
      <ul>
        <li>
          <strong>King</strong> (玉/王): one square any direction. <strong>Rook</strong> (飛):
          straight lines. <strong>Bishop</strong> (角): diagonals.
        </li>
        <li>
          <strong>Gold</strong> (金): one square orthogonally or diagonally forward.{' '}
          <strong>Silver</strong> (銀): one square diagonally or straight forward.
        </li>
        <li>
          <strong>Knight</strong> (桂): jumps two forward and one sideways, forward only.{' '}
          <strong>Lance</strong> (香): any distance straight forward. <strong>Pawn</strong> (歩):
          one square forward, and captures the same way.
        </li>
      </ul>
      <h3>Promotion</h3>
      <ul>
        <li>
          The three far ranks are the promotion zone. Moving into, out of or within it, a piece may
          promote (shown in red): rook → dragon (adds one diagonal step), bishop → horse (adds one
          orthogonal step), silver, knight, lance and pawn → move like a gold. King and gold never
          promote.
        </li>
        <li>
          Promotion is compulsory when the piece could never move again: a pawn or lance on the last
          rank, a knight on the last two.
        </li>
      </ul>
      <h3>Drops</h3>
      <ul>
        <li>
          Captured pieces join your hand; instead of moving you may place one on any empty square
          (unpromoted).
        </li>
        <li>
          You may not drop a piece where it could never move, a pawn on a file where you already
          have an unpromoted pawn (<em>nifu</em>), or a pawn that gives checkmate (
          <em>uchifuzume</em>).
        </li>
      </ul>
      <h3>End of the game</h3>
      <ul>
        <li>Checkmate wins; a player with no legal move loses.</li>
        <li>
          The same position (hands and turn included) four times is a draw (<em>sennichite</em>),
          unless one side gave check with every move of the cycle — that side loses.
        </li>
        <li>
          512-ply limit: draw (point counting for kings that entered the enemy camp is not
          implemented).
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a piece, then its destination. To drop, tap the piece in your hand, then the square.
          When promotion is optional you choose “Promote” or “Keep”.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
