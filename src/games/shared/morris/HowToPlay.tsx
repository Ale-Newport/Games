import type { Locale } from '../../../core/i18n';
import type { MorrisVariant } from './engine';

/** Rules page shared by the Morris games, adapted to each variant. */
export function MorrisRulesText({ locale, v }: { locale: Locale; v: MorrisVariant }) {
  const n = v.pieces;
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        {v.millWins ? (
          <p>
            Sé el primero en alinear tus tres fichas en una <strong>fila o columna</strong>.
          </p>
        ) : (
          <p>
            Deja al rival con <strong>dos fichas</strong> o <strong>sin jugadas</strong>.
          </p>
        )}
        <h3>Reglas</h3>
        <ul>
          <li>
            Blancas empiezan. Primero, por turnos, cada jugador coloca sus {n} fichas en puntos
            vacíos. Después, cada turno se desliza una ficha a un punto vecino libre siguiendo las
            líneas{v.millWins ? ' (diagonales incluidas)' : ''}.
          </li>
          {v.millWins ? (
            <li>Las diagonales sirven para mover pero no cuentan como línea ganadora.</li>
          ) : (
            <li>
              Tres fichas propias en una línea forman un <strong>molino</strong>: retiras una ficha
              rival que no esté en un molino (si todas lo están, cualquiera).
            </li>
          )}
          {v.flying && <li>Con solo tres fichas puedes «volar»: mover a cualquier punto vacío.</li>}
          <li>Tablas por triple repetición o tras demasiadas jugadas sin molinos.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca un punto para colocar; para mover, toca tu ficha y luego el destino. Si formas un
            molino, toca la ficha rival que quieres retirar.
          </li>
          <li>
            <kbd>Tab</kbd> recorre los puntos · <kbd>Intro</kbd> seleccionar / colocar ·{' '}
            <kbd>Esc</kbd> cancelar · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd>{' '}
            reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      {v.millWins ? (
        <p>
          Be the first to line up your three pieces in a <strong>row or column</strong>.
        </p>
      ) : (
        <p>
          Leave your opponent with <strong>two pieces</strong> or <strong>no legal move</strong>.
        </p>
      )}
      <h3>Rules</h3>
      <ul>
        <li>
          White starts. First the players take turns placing their {n} pieces on empty points. Then
          each turn slides one piece to a free neighboring point along the lines
          {v.millWins ? ' (diagonals included)' : ''}.
        </li>
        {v.millWins ? (
          <li>Diagonals are for moving only; they do not count as a winning line.</li>
        ) : (
          <li>
            Three of your pieces on one line form a <strong>mill</strong>: remove an opponent piece
            that is not in a mill (any piece if all of them are).
          </li>
        )}
        {v.flying && <li>With only three pieces left you may “fly” to any empty point.</li>}
        <li>Draws by threefold repetition or after too many moves without a mill.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a point to place; to move, tap your piece and then its destination. When you close a
          mill, tap the opponent piece to remove.
        </li>
        <li>
          <kbd>Tab</kbd> walks the points · <kbd>Enter</kbd> select / place · <kbd>Esc</kbd> cancel
          · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
