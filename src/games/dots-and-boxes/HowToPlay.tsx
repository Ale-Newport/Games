import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cerrar <strong>más cajas</strong> que el rival en una cuadrícula de 4×4 cajas.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Naranja empieza. Por turnos, cada jugador traza una línea entre dos puntos vecinos.
          </li>
          <li>
            Quien traza el cuarto lado de una caja (o de dos a la vez) se la queda y{' '}
            <strong>vuelve a trazar</strong>.
          </li>
          <li>
            Cuando todas las líneas están trazadas, gana quien tenga más cajas; 8–8 es tablas.
          </li>
          <li>
            Consejo: el tercer lado de una caja se la regala al rival. Al final, las cadenas largas
            deciden la partida: a veces conviene dejar las dos últimas cajas de una cadena (doble
            cesión) para controlar la siguiente.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca entre dos puntos para trazar. Las cajas a punto de cerrarse se marcan en ámbar.
          </li>
          <li>
            Flechas para elegir línea, <kbd>Intro</kbd> trazar · <kbd>U</kbd> deshacer ·{' '}
            <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Close <strong>more boxes</strong> than your opponent on a 4×4 grid of boxes.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Orange starts. Players take turns drawing one line between two neighboring dots.</li>
        <li>
          Drawing the fourth side of a box (or of two boxes at once) claims it, and you{' '}
          <strong>draw again</strong>.
        </li>
        <li>When every line is drawn, the most boxes wins; 8–8 is a draw.</li>
        <li>
          Tip: the third side of a box hands it to your opponent. Late in the game long chains
          decide everything — sometimes it pays to leave the last two boxes of a chain (a
          double-deal) to keep control of the next one.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap between two dots to draw. Boxes about to close are outlined in amber.</li>
        <li>
          Arrows pick a line, <kbd>Enter</kbd> draws · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
