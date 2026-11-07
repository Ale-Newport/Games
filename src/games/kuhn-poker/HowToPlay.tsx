import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Dejar al rival sin fichas. Es el póker más pequeño posible, ideado para estudiar la
          estrategia: tres cartas, una ronda de apuestas. Solo fichas de juego.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>
            La baraja tiene una <strong>jota</strong>, una <strong>dama</strong> y un{' '}
            <strong>rey</strong>. Cada uno pone 1 ficha de ante y recibe una carta; la tercera no se
            usa.
          </li>
          <li>
            Habla primero un jugador (se alterna cada mano): <strong>pasa</strong> o{' '}
            <strong>apuesta</strong> 1 ficha.
          </li>
          <li>
            Si pasó, el otro pasa (se enseñan las cartas) o apuesta; ante esa apuesta el primero se
            retira o iguala.
          </li>
          <li>Si apostó, el otro se retira o iguala.</li>
          <li>
            Gana la carta más alta en el enfrentamiento; quien se retira pierde lo que puso. Cada
            mano mueve 1 o 2 fichas.
          </li>
          <li>
            Ambos empiezan con 12 fichas; quien ya no puede cubrir una mano (2 fichas) pierde la
            partida.
          </li>
        </ul>
        <h3>La IA</h3>
        <p>
          «Nash» juega el equilibrio que calcula el algoritmo CFR+: farolea con la jota en una
          proporción exacta y a veces pasa con el rey. Activa «Ver Nash» para ver con qué frecuencia
          elegiría cada jugada en tu lugar.
        </p>
        <h3>Controles</h3>
        <p>
          Botones o <kbd>C</kbd> pasar/igualar · <kbd>B</kbd> apostar · <kbd>F</kbd> retirarse ·{' '}
          <kbd>H</kbd> entrenador Nash · <kbd>N</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Take all your opponent&apos;s chips. This is the smallest possible poker, designed to study
        strategy: three cards, one betting round. Play chips only.
      </p>
      <h3>A hand</h3>
      <ul>
        <li>
          The deck has a <strong>jack</strong>, a <strong>queen</strong> and a <strong>king</strong>
          . Each player antes 1 chip and gets one card; the third is not used.
        </li>
        <li>
          One player acts first (alternating every hand): <strong>check</strong> or{' '}
          <strong>bet</strong> 1 chip.
        </li>
        <li>
          After a check, the other checks (cards are shown) or bets; facing that bet the first
          player folds or calls.
        </li>
        <li>After a bet, the other folds or calls.</li>
        <li>
          The higher card wins the showdown; a player who folds loses what they put in. Every hand
          moves 1 or 2 chips.
        </li>
        <li>
          Both start with 12 chips; whoever can no longer cover a hand (2 chips) loses the match.
        </li>
      </ul>
      <h3>The AI</h3>
      <p>
        &quot;Nash&quot; plays the equilibrium computed by the CFR+ algorithm: it bluffs with the
        jack in an exact proportion and sometimes checks a king. Turn on &quot;Show Nash&quot; to
        see how often it would make each move in your place.
      </p>
      <h3>Controls</h3>
      <p>
        Buttons or <kbd>C</kbd> check/call · <kbd>B</kbd> bet · <kbd>F</kbd> fold · <kbd>H</kbd>{' '}
        Nash coach · <kbd>N</kbd> next hand.
      </p>
    </>
  );
}
