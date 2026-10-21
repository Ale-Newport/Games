import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue <strong>cinco canicas</strong> de tu color seguidas en fila, columna o diagonal.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>Blancas empiezan. Coloca una canica en cualquier hueco libre.</li>
          <li>
            Después <strong>gira</strong> uno de los cuatro cuadrantes de 3×3 un cuarto de vuelta,
            en el sentido que quieras (el giro es obligatorio).
          </li>
          <li>
            Si ya tienes cinco al colocar, ganas sin girar. Si el giro hace cinco para ambos, o el
            tablero se llena sin cinco, es empate; si solo hace cinco para el rival, gana el rival.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca un hueco y luego una de las flechas de giro de un cuadrante.</li>
          <li>
            <kbd>Tab</kbd> recorre huecos y giros · <kbd>Intro</kbd> elegir · <kbd>U</kbd> deshacer
            · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Get <strong>five marbles</strong> of your color in a row, column or diagonal.
      </p>
      <h3>Turn</h3>
      <ul>
        <li>White starts. Place a marble in any empty hole.</li>
        <li>
          Then <strong>twist</strong> one of the four 3×3 quadrants a quarter turn, either way (the
          twist is compulsory).
        </li>
        <li>
          If the placement already makes five you win without twisting. If the twist makes five for
          both players, or the board fills up without five, it is a draw; if it makes five only for
          your opponent, they win.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a hole, then one of a quadrant&apos;s twist arrows.</li>
        <li>
          <kbd>Tab</kbd> walks holes and twists · <kbd>Enter</kbd> choose · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
