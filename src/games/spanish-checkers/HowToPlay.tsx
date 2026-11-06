import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Deja a tu rival <strong>sin piezas o sin jugadas</strong>.
        </p>
        <h3>Reglas (damas españolas)</h3>
        <ul>
          <li>Tablero de 8×8 con 12 peones por bando. Blancas empiezan.</li>
          <li>
            Los peones avanzan una casilla en diagonal y{' '}
            <strong>solo capturan hacia delante</strong>.
          </li>
          <li>
            Las damas son <strong>voladoras</strong>: recorren cualquier número de casillas libres y
            capturan a distancia.
          </li>
          <li>
            <strong>Capturar es obligatorio.</strong> Ley de la cantidad: hay que capturar el mayor
            número de piezas. Ley de la calidad: a igual número, el mayor número de damas.
          </li>
          <li>Un peón que llega a la última fila corona y la jugada termina.</li>
          <li>
            Pierde quien no puede mover. Tablas por triple repetición o tras 40 jugadas de cada
            bando sin capturas ni movimientos de peón.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza resaltada y luego cada casilla de aterrizaje en orden.</li>
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
        Leave your opponent <strong>without pieces or without legal moves</strong>.
      </p>
      <h3>Rules (Spanish draughts)</h3>
      <ul>
        <li>8×8 board with 12 men each. White moves first.</li>
        <li>
          Men move one square diagonally forward and <strong>capture forward only</strong>.
        </li>
        <li>
          Kings <strong>fly</strong>: they travel any number of empty squares and capture at a
          distance.
        </li>
        <li>
          <strong>Captures are compulsory.</strong> Law of quantity: take the most pieces. Law of
          quality: with equal numbers, take the most kings.
        </li>
        <li>A man reaching the far row is crowned and the move ends.</li>
        <li>
          A player who cannot move loses. Draws by threefold repetition or after 40 moves by each
          side without a capture or a man move.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a highlighted piece, then each landing square in order.</li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
