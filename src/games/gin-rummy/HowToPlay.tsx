import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Llegar el primero a 100 puntos formando combinaciones con tus diez cartas.</p>
        <h3>Combinaciones</h3>
        <ul>
          <li>
            <strong>Grupo</strong>: tres o cuatro cartas del mismo valor. <strong>Escalera</strong>:
            tres o más cartas seguidas del mismo palo (el as va abajo).
          </li>
          <li>
            Las cartas que no forman parte de ninguna combinación son la <strong>madera</strong>: el
            as vale 1, las figuras 10 y el resto su número.
          </li>
        </ul>
        <h3>Un turno</h3>
        <ul>
          <li>
            Roba la carta de arriba del mazo o del montón de descartes y descarta una (no la que
            acabas de coger del montón).
          </li>
          <li>
            Si al descartar tu madera queda en 10 o menos puedes <strong>llamar</strong>: se enseñan
            las manos y el rival coloca su madera en tus combinaciones si encaja. Ganas la
            diferencia de madera, pero si el rival tiene igual o menos te hace un{' '}
            <strong>undercut</strong> y gana 25 más la diferencia.
          </li>
          <li>
            <strong>Gin</strong>: llamar sin madera; ganas 25 más la madera del rival, que no puede
            colocar nada.
          </li>
          <li>Si en el mazo quedan dos cartas sin que nadie llame, la mano no puntúa.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca el mazo o el descarte para robar; toca una carta y pulsa «Descartar» o «Llamar».{' '}
          <kbd>S</kbd> mazo · <kbd>D</kbd> descarte · <kbd>←</kbd>/<kbd>→</kbd> elegir ·{' '}
          <kbd>Intro</kbd> descartar · <kbd>K</kbd> llamar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to 100 points by forming melds with your ten cards.</p>
      <h3>Melds</h3>
      <ul>
        <li>
          <strong>Set</strong>: three or four cards of the same rank. <strong>Run</strong>: three or
          more consecutive cards of one suit (the ace is low).
        </li>
        <li>
          Cards outside your melds are <strong>deadwood</strong>: ace 1, face cards 10, others their
          number.
        </li>
      </ul>
      <h3>A turn</h3>
      <ul>
        <li>
          Draw the top card of the stock or of the discard pile, then throw one card (not the card
          you just took from the pile).
        </li>
        <li>
          If your deadwood after throwing is 10 or less you may <strong>knock</strong>: the hands
          are shown and your opponent lays off deadwood on your melds where it fits. You score the
          difference in deadwood — but if theirs is equal or lower, they <strong>undercut</strong>{' '}
          you and score 25 plus the difference.
        </li>
        <li>
          <strong>Gin</strong>: knocking with no deadwood scores 25 plus all of your opponent&apos;s
          deadwood, and they cannot lay off.
        </li>
        <li>If two cards are left in the stock and nobody has knocked, the hand scores nothing.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap the stock or the discard pile to draw; tap a card and press Discard or Knock.{' '}
        <kbd>S</kbd> stock · <kbd>D</kbd> discard pile · <kbd>←</kbd>/<kbd>→</kbd> choose ·{' '}
        <kbd>Enter</kbd> throw · <kbd>K</kbd> knock · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
