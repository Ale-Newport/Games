import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sé el primero en llegar a la casilla 100.</p>
        <h3>Turno</h3>
        <ul>
          <li>
            Todos empiezan fuera del tablero. Tira y avanza tantas casillas como marque el dado.
          </li>
          <li>
            Si caes al pie de una escalera, subes hasta arriba; si caes en la cabeza de una
            serpiente, bajas hasta su cola.
          </li>
          <li>Para llegar al 100 hace falta la tirada exacta: si te pasas, no te mueves.</li>
        </ul>
        <h3>Variantes</h3>
        <p>
          <b>Clásico</b>: un dado y ninguna decisión. <b>Elección</b>: tira dos dados y mueve con el
          que prefieras; la pista te dice cuál deja menos turnos esperados hasta el final.
        </p>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · en Elección, toca un dado o pulsa <kbd>1</kbd> o{' '}
          <kbd>2</kbd> · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to reach square 100.</p>
      <h3>A turn</h3>
      <ul>
        <li>Everyone starts off the board. Roll and move that many squares.</li>
        <li>
          Landing at the foot of a ladder takes you up to its top; landing on a snake's head takes
          you down to its tail.
        </li>
        <li>
          Reaching 100 needs the exact throw: a throw that would go past it does not move you.
        </li>
      </ul>
      <h3>Variants</h3>
      <p>
        <b>Classic</b>: one die and no decisions. <b>Choice</b>: throw two dice and move by the one
        you prefer; the hint tells you which leaves the fewest expected turns to the end.
      </p>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll · in Choice, tap a die or press <kbd>1</kbd> or{' '}
        <kbd>2</kbd> · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
