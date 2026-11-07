import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sé el primero en llegar a 100 puntos.</p>
        <h3>Turno</h3>
        <ul>
          <li>Tira el dado tantas veces como quieras; cada tirada se suma al total del turno.</li>
          <li>Plántate para pasar el total del turno a tu marcador; entonces juega el rival.</li>
          <li>Si sale un 1, pierdes el total del turno y le toca al rival.</li>
          <li>Al llegar a 100 ganas al instante.</li>
        </ul>
        <p>
          El juego está resuelto: el rival «Perfecto» y las pistas usan la estrategia óptima
          calculada por iteración de valor, y la pista te dice tu probabilidad de ganar.
        </p>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · <kbd>B</kbd> o <kbd>Enter</kbd> plantarse ·{' '}
          <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to reach 100 points.</p>
      <h3>A turn</h3>
      <ul>
        <li>Roll the die as often as you like; each throw adds to your turn total.</li>
        <li>Hold to move the turn total to your score; then your opponent plays.</li>
        <li>Roll a 1 and you lose the turn total, and your opponent plays.</li>
        <li>Reaching 100 wins at once.</li>
      </ul>
      <p>
        The game is solved: the Perfect opponent and the hints use the optimal strategy computed by
        value iteration, and a hint tells you your chance of winning.
      </p>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll · <kbd>B</kbd> or <kbd>Enter</kbd> hold · <kbd>H</kbd>{' '}
        hint.
      </p>
    </>
  );
}
