import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Comer todas las semillas del laberinto, nivel tras nivel, sin que te atrapen.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Tu robot avanza por los pasillos hasta chocar con una pared; giras en los cruces (puedes
            pedir el giro antes de llegar).
          </li>
          <li>Cada semilla vale 10 puntos; las cuatro celdas de energía, 50.</li>
          <li>
            Cuatro centinelas te persiguen, cada uno a su manera, alternando la caza con ratos en
            sus esquinas. Si te toca uno, pierdes una vida (tienes tres, y una más a los 10 000
            puntos).
          </li>
          <li>
            Tras una celda de energía se vuelven azules unos segundos: atrápalos por 200, 400, 800 y
            1600. Sus ojos vuelven a casa y salen de nuevo.
          </li>
          <li>Dos veces por nivel aparece una gema de bonificación.</li>
          <li>Al vaciar el laberinto empieza el siguiente nivel, más rápido.</li>
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
      <p>Eat every seed in the maze, level after level, without being caught.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Your rover runs along the corridors until it meets a wall; you turn at junctions (you can
          ask for a turn before you get there).
        </li>
        <li>Each seed is worth 10 points; the four power cells 50.</li>
        <li>
          Four sentinels hunt you, each in its own way, between spells in their corners. Touch one
          and you lose a life (you have three, and one more at 10 000 points).
        </li>
        <li>
          After a power cell they turn blue for a few seconds: catch them for 200, 400, 800 and
          1600. Their eyes go home and they come out again.
        </li>
        <li>A bonus gem appears twice a level.</li>
        <li>Clearing the maze starts the next level, faster.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or the touch pad · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
