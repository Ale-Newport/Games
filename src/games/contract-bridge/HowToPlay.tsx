import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tú (sur) y tu compañero (norte) contra este y oeste. Un Chicago son cuatro manos; gana la
          pareja con más puntos al final.
        </p>
        <h3>La subasta</h3>
        <ul>
          <li>
            Empieza el que reparte. Una voz es un nivel (1–7: bazas por encima de seis) y una
            denominación: ♣ &lt; ♦ &lt; ♥ &lt; ♠ &lt; sin triunfo (SA). Cada voz debe superar a la
            anterior.
          </li>
          <li>
            También puedes pasar, doblar la última voz de los rivales o redoblar su doblo. Tres
            pasos seguidos tras una voz cierran la subasta; si los cuatro pasan, la mano no puntúa.
          </li>
          <li>
            El <strong>declarante</strong> es el primero de la pareja ganadora que nombró la
            denominación final. Si es tu pareja, juegas tú las dos manos.
          </li>
        </ul>
        <h3>El carteo</h3>
        <ul>
          <li>
            Sale el jugador a la izquierda del declarante; después el compañero del declarante (el{' '}
            <strong>muerto</strong>) muestra sus cartas y el declarante las juega.
          </li>
          <li>Hay que seguir el palo. El triunfo, si lo hay, gana a los demás palos.</li>
        </ul>
        <h3>Puntuación</h3>
        <ul>
          <li>
            Cada baza contratada vale 20 (♣ ♦) o 30 (♥ ♠; en SA 40 la primera y 30 las demás). Con
            100 o más se gana la <strong>manga</strong>: +300 (o +500 vulnerable); si no, +50.
            Pequeño slam (6) +500/+750, gran slam (7) +1000/+1500.
          </li>
          <li>
            Si el declarante no cumple, los defensores cobran 50 por baza (100 vulnerable), más si
            estaba doblado. Vulnerabilidad del Chicago: nadie, la pareja que reparte (dos veces) y
            todos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Elige tu voz en la caja de subasta (<kbd>P</kbd> paso, <kbd>D</kbd> doblo); después toca
          tus cartas o las del muerto. <kbd>H</kbd> pista, <kbd>N</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        You (south) and your partner (north) against east and west. A Chicago is four deals; the
        side with more points at the end wins.
      </p>
      <h3>The auction</h3>
      <ul>
        <li>
          The dealer starts. A bid is a level (1–7: tricks above six) and a strain: ♣ &lt; ♦ &lt; ♥
          &lt; ♠ &lt; no trump (NT). Every bid must outrank the last one.
        </li>
        <li>
          You may also pass, double the opponents&apos; last bid or redouble their double. Three
          passes after a bid end the auction; if all four pass, the deal scores nothing.
        </li>
        <li>
          The <strong>declarer</strong> is the first player of the winning side to have named the
          final strain. If that is your side, you play both hands.
        </li>
      </ul>
      <h3>The play</h3>
      <ul>
        <li>
          The player on the declarer&apos;s left leads; then the declarer&apos;s partner (the{' '}
          <strong>dummy</strong>) lays their cards face up and the declarer plays them.
        </li>
        <li>Follow suit if you can. The trump suit, if any, beats the other suits.</li>
      </ul>
      <h3>Scoring</h3>
      <ul>
        <li>
          Each contracted trick is worth 20 (♣ ♦) or 30 (♥ ♠; in NT 40 for the first and 30 after).
          100 or more makes <strong>game</strong>: +300 (or +500 vulnerable); otherwise +50. Small
          slam (6) +500/+750, grand slam (7) +1000/+1500.
        </li>
        <li>
          If the declarer falls short, the defenders score 50 a trick (100 vulnerable), more when
          doubled. Chicago vulnerability: none, the dealer&apos;s side (twice), then both.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Choose your call in the bidding box (<kbd>P</kbd> pass, <kbd>D</kbd> double); then tap your
        cards or dummy&apos;s. <kbd>H</kbd> hint, <kbd>N</kbd> next deal.
      </p>
    </>
  );
}
