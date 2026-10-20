import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Gana quien da <strong>jaque mate</strong> o quien da <strong>tres jaques</strong> en
          total.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Todas las reglas del ajedrez; los jaques de cada bando se cuentan (también los dobles,
            que cuentan como uno).
          </li>
          <li>El tercer jaque termina la partida al instante, aunque el rey pudiera escapar.</li>
          <li>
            Tablas por ahogado, triple repetición, 50 jugadas o cuando solo quedan los dos reyes. Un
            caballo o alfil solitario todavía puede dar jaques, así que no hay tablas por material
            insuficiente.
          </li>
          <li>La línea de estado muestra los jaques de cada bando.</li>
        </ul>
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
        Win by <strong>checkmate</strong> or by giving <strong>three checks</strong> in total.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          All the rules of chess; each side's checks are counted (a double check counts once).
        </li>
        <li>The third check ends the game at once, even if the king could escape.</li>
        <li>
          Draws by stalemate, threefold repetition, fifty moves, or when only the two kings remain.
          A lone knight or bishop can still give checks, so there is no insufficient-material draw.
        </li>
        <li>The status line shows both check counts.</li>
      </ul>
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
