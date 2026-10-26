import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Reunir más <strong>libros</strong> (las cuatro cartas de un mismo número) que nadie.
        </p>
        <h3>Reparto</h3>
        <p>
          Siete cartas a cada jugador con dos o tres jugadores, cinco con cuatro. El resto queda
          boca abajo: es el <strong>estanque</strong>.
        </p>
        <h3>Un turno</h3>
        <ul>
          <li>Pide a otro jugador un número del que tengas al menos una carta.</li>
          <li>Si tiene, te da todas las de ese número y vuelves a pedir.</li>
          <li>
            Si no, te dice «¡a pescar!» y robas del estanque. Si sacas justo el número que pediste,
            lo enseñas y vuelves a pedir; si no, el turno pasa al siguiente.
          </li>
          <li>En cuanto juntas un libro lo bajas a la mesa.</li>
          <li>Si te quedas sin cartas, robas una del estanque (o pasas si está vacío).</li>
        </ul>
        <h3>Fin</h3>
        <p>Cuando están bajados los trece libros, gana quien tenga más (un empate se comparte).</p>
        <h3>Controles</h3>
        <p>
          Toca una carta para elegir su número y luego al rival (con un solo rival, la petición es
          inmediata). <kbd>←</kbd>/<kbd>→</kbd> número · <kbd>1</kbd>–<kbd>3</kbd> pedir a ese rival
          · <kbd>D</kbd> robar · <kbd>P</kbd> pasar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Collect more <strong>books</strong> (all four cards of a rank) than anyone else.
      </p>
      <h3>Deal</h3>
      <p>
        Seven cards each with two or three players, five with four. The rest lie face down: the{' '}
        <strong>pond</strong>.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>Ask another player for a rank you hold at least one card of.</li>
        <li>If they have any, they hand them all over and you ask again.</li>
        <li>
          If not, they say &ldquo;Go fish!&rdquo; and you draw from the pond. If you draw the very
          rank you asked for, show it and ask again; otherwise the turn passes on.
        </li>
        <li>As soon as you hold a book, it is laid down.</li>
        <li>If your hand is empty, draw a card from the pond (or pass when it is empty).</li>
      </ul>
      <h3>End</h3>
      <p>When all thirteen books are down, the most books wins (a tie shares the win).</p>
      <h3>Controls</h3>
      <p>
        Tap a card to pick its rank, then the opponent (with a single opponent the ask is
        immediate). <kbd>←</kbd>/<kbd>→</kbd> rank · <kbd>1</kbd>–<kbd>3</kbd> ask that opponent ·{' '}
        <kbd>D</kbd> draw · <kbd>P</kbd> pass · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
