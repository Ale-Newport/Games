import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Llegar lo más lejos posible por carriles que no se acaban.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Cada pulsación es un salto de una casilla; mantener pulsado repite.</li>
          <li>Los árboles de los prados cortan el paso.</li>
          <li>
            En las carreteras, cuidado con los coches; en las vías, la señal parpadea antes del
            tren.
          </li>
          <li>En los ríos solo puedes pisar troncos; si te arrastran fuera, te pierdes.</li>
          <li>
            La vista avanza sola y cada vez más deprisa: si te quedas atrás, el halcón te atrapa.
            Solo hay una vida; tu puntuación es la fila más lejana.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> o el panel táctil ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Get as far as you can through lanes that never end.</p>
      <h3>How to play</h3>
      <ul>
        <li>Each press is a one-cell hop; holding repeats.</li>
        <li>Trees in the meadows block the way.</li>
        <li>On roads, mind the cars; on railways, the signal flashes before a train.</li>
        <li>In rivers you can only stand on logs; be carried off the edge and you’re lost.</li>
        <li>
          The view moves forward on its own, ever faster: fall behind and the hawk takes you. There
          is one life; your score is the furthest row.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or the touch pad · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
