import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Poner boca arriba <strong>todo el reloj</strong> antes de que salga el cuarto rey.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Trece montones de cuatro cartas boca abajo: uno por hora (as a la una … reina a las
            doce) y los reyes en el centro.
          </li>
          <li>
            La primera carta se gira del montón de los reyes. Cada carta girada va boca arriba bajo
            el montón de su hora y la siguiente se gira de ese mismo montón.
          </li>
          <li>Al salir el cuarto rey termina la partida: se gana si ya está todo boca arriba.</li>
          <li>
            No hay decisiones: es un juego de pura suerte (sale más o menos una de cada trece).
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca el montón que brilla para girar su carta y toca la carta para llevarla a su hora (o
            arrástrala hasta allí).
          </li>
          <li>
            <kbd>D</kbd> girar · <kbd>A</kbd> colocar · <kbd>U</kbd> deshacer · <kbd>N</kbd> nueva
            partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Turn <strong>the whole clock</strong> face up before the fourth king comes up.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Thirteen piles of four face-down cards: one per hour (ace at one … queen at twelve) and
          the kings in the middle.
        </li>
        <li>
          The first card is turned from the kings' pile. Each turned card goes face up under the
          pile of its hour, and the next card is turned from that same pile.
        </li>
        <li>The fourth king ends the game: you win if everything is already face up.</li>
        <li>
          There are no choices: it is a game of pure luck (about one deal in thirteen comes out).
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap the glowing pile to turn its card, then tap the card to take it to its hour (or drag
          it there).
        </li>
        <li>
          <kbd>D</kbd> turn · <kbd>A</kbd> place · <kbd>U</kbd> undo · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
