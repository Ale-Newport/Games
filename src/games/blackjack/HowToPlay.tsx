import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Acercarte a <strong>21</strong> más que la banca sin pasarte. Se juega con fichas, nunca
          con dinero real.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Las figuras valen 10 y el as 1 u 11. Un as y una carta de 10 de entrada es{' '}
            <strong>blackjack</strong> y paga 3 a 2.
          </li>
          <li>
            Apuesta y recibes dos cartas; la banca muestra una. <strong>Pide</strong> cartas o{' '}
            <strong>plántate</strong>.
          </li>
          <li>
            <strong>Doblar</strong>: duplicas la apuesta y recibes una sola carta.{' '}
            <strong>Separar</strong> una pareja la convierte en dos manos (hasta cuatro); los ases
            separados reciben una carta cada uno.
          </li>
          <li>
            Con un as visible la banca ofrece <strong>seguro</strong> (media apuesta, paga 2 a 1 si
            tiene blackjack). Con as o 10 visible, la banca comprueba su blackjack.
          </li>
          <li>
            La banca pide hasta 17 y se planta con 17 blando. Ganar paga 1 a 1; empate devuelve la
            apuesta.
          </li>
          <li>
            Seis barajas que se barajan al gastar el 75 %. Empiezas con 1000 fichas; si te quedas
            sin ellas se reponen.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una ficha para apostar y repartir; usa los botones para jugar. «Pista» muestra la
            estrategia básica.
          </li>
          <li>
            <kbd>1</kbd>–<kbd>6</kbd> apostar · <kbd>H</kbd> pedir · <kbd>S</kbd> plantarse ·{' '}
            <kbd>D</kbd> doblar · <kbd>P</kbd> separar · <kbd>I</kbd> seguro · <kbd>N</kbd> sin
            seguro / siguiente · <kbd>B</kbd> pista.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Get closer to <strong>21</strong> than the dealer without going over. Played with chips,
        never real money.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Face cards count 10, aces 1 or 11. An ace and a ten-value card as your first two cards is{' '}
          <strong>blackjack</strong> and pays 3 to 2.
        </li>
        <li>
          Bet and you get two cards; the dealer shows one. <strong>Hit</strong> for more or{' '}
          <strong>stand</strong>.
        </li>
        <li>
          <strong>Double</strong>: double the bet and take exactly one more card.{' '}
          <strong>Split</strong> a pair into two hands (up to four); split aces get one card each.
        </li>
        <li>
          With an ace showing the dealer offers <strong>insurance</strong> (half your bet, pays 2 to
          1 if the dealer has blackjack). With an ace or a ten showing, the dealer checks for
          blackjack.
        </li>
        <li>
          The dealer draws to 17 and stands on soft 17. A win pays 1 to 1; a push returns the bet.
        </li>
        <li>
          Six decks, reshuffled once 75% has been dealt. You start with 1000 chips, refilled if you
          run out.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a chip to bet and deal; use the buttons to play. "Hint" shows basic strategy.</li>
        <li>
          <kbd>1</kbd>–<kbd>6</kbd> bet · <kbd>H</kbd> hit · <kbd>S</kbd> stand · <kbd>D</kbd>{' '}
          double · <kbd>P</kbd> split · <kbd>I</kbd> insurance · <kbd>N</kbd> no insurance / next ·{' '}
          <kbd>B</kbd> hint.
        </li>
      </ul>
    </>
  );
}
