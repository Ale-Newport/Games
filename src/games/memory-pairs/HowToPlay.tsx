import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Encontrar todas las parejas: en solitario, en el menor número de turnos; contra el
          ordenador, más parejas que él.
        </p>
        <h3>El turno</h3>
        <ul>
          <li>Da la vuelta a dos cartas. Si son iguales, te las quedas y vuelves a jugar.</li>
          <li>
            Si no, se vuelven a tapar y le toca al otro. Las dos cartas vistas quedan a la vista un
            momento: ¡recuérdalas!
          </li>
        </ul>
        <h3>Los rivales</h3>
        <p>
          El Despistado solo recuerda las últimas 6 cartas vistas, el Atento las últimas 14 y el
          Perfecto, todas.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una carta para darle la vuelta · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Find every pair: solo, in as few turns as you can; against the computer, more pairs than it.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>Turn over two cards. If they match, you take them and go again.</li>
        <li>
          If not, they turn back and the other player goes. Both cards stay visible for a moment:
          remember them!
        </li>
      </ul>
      <h3>Opponents</h3>
      <p>
        Forgetful remembers only the last 6 cards turned over, Attentive the last 14, and Perfect
        every one.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a card to turn it over · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
