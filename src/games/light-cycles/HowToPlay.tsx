import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el último corredor en marcha. Quien gane tres rondas se lleva la partida.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Tu moto (cian) avanza sola y deja un muro de luz; tú decides los giros.</li>
          <li>Chocar con el borde, con un muro o con cualquier estela te deja fuera.</li>
          <li>
            Si dos chocan de frente, quedan fuera los dos; si los últimos caen a la vez, es empate.
          </li>
          <li>
            Elige uno o tres rivales en el menú. Cada paso sobrevivido es un punto; cada ronda, 100.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas o el panel táctil · o toca hacia donde quieras girar · <kbd>P</kbd> pausa ·{' '}
          <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the last racer moving. The first to three rounds takes the match.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Your racer (cyan) moves on its own and leaves a wall of light; you choose the turns.
        </li>
        <li>Running into the edge, a wall or any trail puts you out.</li>
        <li>Two meeting head-on both go out; if the last ones crash together, it is a draw.</li>
        <li>
          Choose one or three rivals in the menu. Each move survived is a point; each round won 100.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows or the touch pad · or touch where you want to turn · <kbd>P</kbd> pause ·{' '}
        <kbd>R</kbd> restart.
      </p>
    </>
  );
}
