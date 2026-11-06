import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llevar <strong>un peón a la última fila</strong> del rival, o capturar todos sus peones.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Blancas empiezan. Cada bando tiene 16 peones en sus dos primeras filas.</li>
          <li>
            Un peón avanza una casilla <strong>recto</strong> (solo a una vacía) o en{' '}
            <strong>diagonal</strong> (a una vacía o capturando un peón rival).
          </li>
          <li>Los peones nunca retroceden ni capturan de frente.</li>
          <li>
            Gana el primer peón que llega a la fila del fondo. También gana quien captura todos los
            peones rivales. No hay tablas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca tu peón: los puntos verdes son avances y los anillos rojos, capturas.</li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / mover, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Get <strong>one pawn to the far row</strong>, or capture all of your opponent&apos;s pawns.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>White starts. Each side has 16 pawns on its first two rows.</li>
        <li>
          A pawn steps one cell <strong>straight</strong> forward (only onto an empty cell) or{' '}
          <strong>diagonally</strong> forward (onto an empty cell, or capturing an enemy pawn).
        </li>
        <li>Pawns never move backward and never capture straight ahead.</li>
        <li>
          The first pawn to reach the far row wins. Capturing every enemy pawn also wins. There are
          no draws.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap your pawn: green dots are steps, red rings are captures.</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
