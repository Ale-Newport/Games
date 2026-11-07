import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Hundir los cinco barcos del ordenador antes de que hunda los tuyos.</p>
        <h3>La flota</h3>
        <p>
          Cada uno tiene una cuadrícula de 10 × 10 con barcos de 5, 4, 3, 3 y 2 casillas, en línea
          recta, horizontal o vertical, sin solaparse (pueden tocarse). Colócalos tú o deja que se
          coloquen al azar.
        </p>
        <h3>Disparos</h3>
        <ul>
          <li>Por turnos, disparáis a una casilla de las aguas del otro.</li>
          <li>Te dicen «agua», «tocado» o «hundido» (con el tamaño del barco).</li>
          <li>Gana quien hunda primero toda la flota contraria.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una casilla de las aguas enemigas para disparar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Sink all five of the computer’s ships before it sinks yours.</p>
      <h3>The fleet</h3>
      <p>
        Each side has a 10 × 10 grid with ships of 5, 4, 3, 3 and 2 cells, in straight lines,
        horizontal or vertical, not overlapping (they may touch). Place yours, or let them be placed
        at random.
      </p>
      <h3>Shots</h3>
      <ul>
        <li>Take turns firing at a cell of the other side’s waters.</li>
        <li>You are told “miss”, “hit” or “sunk” (with the ship’s size).</li>
        <li>The first to sink the whole enemy fleet wins.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a cell in enemy waters to fire · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
