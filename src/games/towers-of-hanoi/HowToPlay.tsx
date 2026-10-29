import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Traslada la torre entera de la primera varilla a la última.</p>
        <h3>Reglas</h3>
        <ul>
          <li>Solo se mueve un disco cada vez: el de arriba de una varilla.</li>
          <li>Nunca se pone un disco sobre otro más pequeño.</li>
        </ul>
        <p>
          Con tres varillas y n discos el mínimo es 2ⁿ − 1 movimientos (7, 31, 127). Con cuatro
          varillas se puede ir mucho más rápido: 6 discos en 17 movimientos.
        </p>
        <h3>Truco</h3>
        <p>
          Con tres varillas, alterna: mueve el disco más pequeño siempre en el mismo sentido y,
          entre medias, haz el único otro movimiento posible.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una varilla y luego otra, o pulsa <kbd>1</kbd>–<kbd>4</kbd> · <kbd>U</kbd> deshacer ·{' '}
          <kbd>H</kbd> pista · <kbd>Esc</kbd> cancelar.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Move the whole tower from the first peg to the last one.</p>
      <h3>Rules</h3>
      <ul>
        <li>Move one disk at a time: the top disk of a peg.</li>
        <li>Never put a disk on a smaller one.</li>
      </ul>
      <p>
        With three pegs and n disks the minimum is 2ⁿ − 1 moves (7, 31, 127). With four pegs it is
        much faster: 6 disks in 17 moves.
      </p>
      <h3>Tip</h3>
      <p>
        With three pegs, alternate: move the smallest disk always the same way round and, in
        between, make the only other legal move.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a peg, then another, or press <kbd>1</kbd>–<kbd>4</kbd> · <kbd>U</kbd> undo ·{' '}
        <kbd>H</kbd> hint · <kbd>Esc</kbd> cancel.
      </p>
    </>
  );
}
