import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Sumar los menos puntos posibles. La partida acaba cuando alguien llega a 100 al final de
          una mano; gana quien tenga menos.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>Cuatro jugadores, trece cartas cada uno, cada uno por su cuenta.</li>
          <li>
            <strong>Pase</strong>: antes de jugar, cada uno pasa tres cartas — a la izquierda, a la
            derecha, enfrente y, en la cuarta mano, sin pase (y vuelta a empezar).
          </li>
          <li>
            El <strong>dos de tréboles</strong> sale en la primera baza. Hay que seguir el palo de
            salida si se puede; la carta más alta del palo de salida gana la baza y su dueño sale en
            la siguiente.
          </li>
          <li>
            En la primera baza no se pueden echar puntos (salvo que no quede otra). No se puede
            salir con corazones hasta que se haya jugado alguno (salvo que solo queden corazones).
          </li>
          <li>
            Cada <strong>corazón</strong> ganado vale 1 punto y la <strong>reina de picas</strong>{' '}
            13.
          </li>
          <li>
            <strong>Disparar a la luna</strong>: quien se lleva los 26 puntos de una mano no suma
            nada y los demás suman 26.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca tres cartas y pulsa «Pasar»; después toca la carta que quieras jugar (las que no
          puedes jugar se ven atenuadas). <kbd>←</kbd>/<kbd>→</kbd> eligen carta, <kbd>Intro</kbd>{' '}
          la juega o la marca, <kbd>P</kbd> pasa, <kbd>H</kbd> pista, <kbd>N</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Score as few points as possible. The game ends when someone reaches 100 at the end of a
        hand; the lowest score wins.
      </p>
      <h3>A hand</h3>
      <ul>
        <li>Four players, thirteen cards each, everyone for themselves.</li>
        <li>
          <strong>Passing</strong>: before play, everyone passes three cards — to the left, to the
          right, across, and on the fourth hand no pass (then round again).
        </li>
        <li>
          The <strong>two of clubs</strong> leads the first trick. Follow the led suit if you can;
          the highest card of the led suit takes the trick and its owner leads the next.
        </li>
        <li>
          No points may be played on the first trick (unless there is no choice). Hearts may not be
          led until one has been played (unless you hold only hearts).
        </li>
        <li>
          Every <strong>heart</strong> taken scores 1 point and the <strong>queen of spades</strong>{' '}
          13.
        </li>
        <li>
          <strong>Shooting the moon</strong>: whoever takes all 26 points of a hand scores nothing
          and everyone else scores 26.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap three cards and press Pass; then tap the card you want to play (cards you cannot play
        are dimmed). <kbd>←</kbd>/<kbd>→</kbd> choose a card, <kbd>Enter</kbd> plays or picks it,{' '}
        <kbd>P</kbd> passes, <kbd>H</kbd> hint, <kbd>N</kbd> next hand.
      </p>
    </>
  );
}
