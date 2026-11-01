import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Crecer todo lo posible (o sumar todo lo que puedas en un minuto) sin chocar.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>No hay paredes: lo que sale por un borde entra por el opuesto.</li>
          <li>
            Cada quinta manzana aparece un bloque gris en el tablero; chocar con él o con tu cuerpo
            termina la partida.
          </li>
          <li>
            A veces aparece una fruta dorada durante seis segundos: vale 50 puntos más un extra por
            llegar pronto.
          </li>
          <li>Modo sprint: un minuto para sumar todo lo que puedas.</li>
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
      <p>Grow as long as you can (or score as much as you can in a minute) without crashing.</p>
      <h3>How to play</h3>
      <ul>
        <li>No walls: whatever leaves one edge comes back on the other.</li>
        <li>
          Every fifth apple drops a grey block on the board; running into it or your body ends the
          run.
        </li>
        <li>
          A golden fruit sometimes appears for six seconds: 50 points plus a bonus for getting there
          fast.
        </li>
        <li>Sprint mode: one minute to score as much as you can.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or the touch pad · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
