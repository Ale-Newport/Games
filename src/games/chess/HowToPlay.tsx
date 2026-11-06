import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Da <strong>jaque mate</strong>: ataca al rey rival de forma que no pueda escapar.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Blancas mueven primero. Rey: una casilla en cualquier dirección. Dama: cualquier
            distancia en línea recta o diagonal. Torre: en línea recta. Alfil: en diagonal. Caballo:
            en «L», saltando piezas. Peón: avanza una casilla (dos desde su casilla inicial) y
            captura en diagonal.
          </li>
          <li>
            <strong>Enroque:</strong> el rey va dos casillas hacia una torre que no se ha movido y
            la torre salta a su lado. No se puede enrocar estando en jaque, cruzando una casilla
            atacada ni con piezas en medio.
          </li>
          <li>
            <strong>Al paso:</strong> si un peón avanza dos casillas y queda junto a un peón rival,
            este puede capturarlo como si hubiera avanzado una, solo en la jugada siguiente.
          </li>
          <li>
            <strong>Coronación:</strong> un peón que llega a la última fila se convierte en dama,
            torre, alfil o caballo.
          </li>
          <li>Nunca puedes dejar a tu propio rey en jaque.</li>
          <li>
            Tablas: ahogado (sin jugadas legales y sin jaque), triple repetición, 50 jugadas de cada
            bando sin capturas ni movimientos de peón, material insuficiente para dar mate o acuerdo
            (dos jugadores).
          </li>
          <li>
            Con reloj, quien agota su tiempo pierde, salvo que el rival ya no pueda dar mate de
            ninguna manera (entonces son tablas).
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una pieza y luego su destino (puntos = jugadas, anillos = capturas), o arrástrala.
            Para enrocar, mueve el rey dos casillas o tócalo y luego la torre.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / mover, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
          <li>Rendirse y acordar tablas piden un segundo toque para confirmar.</li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Deliver <strong>checkmate</strong>: attack the enemy king so that it cannot escape.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          White moves first. King: one square in any direction. Queen: any distance straight or
          diagonally. Rook: straight. Bishop: diagonally. Knight: an “L”, jumping over pieces. Pawn:
          one square forward (two from its starting square) and captures diagonally.
        </li>
        <li>
          <strong>Castling:</strong> the king moves two squares toward an unmoved rook and the rook
          hops next to it. Not allowed while in check, through an attacked square or with pieces in
          between.
        </li>
        <li>
          <strong>En passant:</strong> when a pawn advances two squares and lands beside an enemy
          pawn, that pawn may capture it as if it had moved one square — on the very next move only.
        </li>
        <li>
          <strong>Promotion:</strong> a pawn reaching the last rank becomes a queen, rook, bishop or
          knight.
        </li>
        <li>You may never leave your own king in check.</li>
        <li>
          Draws: stalemate (no legal move and not in check), threefold repetition, 50 moves by each
          side without a capture or pawn move, insufficient material to mate, or agreement (two
          players).
        </li>
        <li>
          On the clock, running out of time loses — unless the opponent could no longer mate in any
          way (then it is a draw).
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a piece, then its destination (dots = moves, rings = captures), or drag it. To castle,
          move the king two squares or tap the king and then the rook.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
        <li>Resign and agree draw ask for a second tap to confirm.</li>
      </ul>
    </>
  );
}
