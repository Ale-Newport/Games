import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Formar <strong>más S-O-S</strong> que el rival.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cuadrícula de 6×6. En tu turno escribe una S o una O en una casilla vacía.</li>
          <li>
            Si tu letra completa una o varias líneas S-O-S (horizontal, vertical o diagonal), sumas
            un punto por cada una y <strong>vuelves a escribir</strong>.
          </li>
          <li>Con la cuadrícula llena gana quien tenga más puntos; el empate es tablas.</li>
          <li>Consejo: evita dejar «S _ S» o «S O _»: son puntos regalados para el rival.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Elige la letra arriba (S u O) y toca una casilla vacía.</li>
          <li>
            Flechas, <kbd>S</kbd> / <kbd>O</kbd> letra, <kbd>Intro</kbd> escribir · <kbd>U</kbd>{' '}
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
        Spell <strong>more S-O-S</strong> lines than your opponent.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>A 6×6 grid. On your turn write an S or an O in an empty cell.</li>
        <li>
          If your letter completes one or more S-O-S lines (across, down or diagonal), you score a
          point for each and <strong>write again</strong>.
        </li>
        <li>When the grid is full the higher score wins; equal scores draw.</li>
        <li>Tip: avoid leaving “S _ S” or “S O _” — those are free points for your opponent.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Pick the letter above (S or O) and tap an empty cell.</li>
        <li>
          Arrows, <kbd>S</kbd> / <kbd>O</kbd> letter, <kbd>Enter</kbd> write · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
