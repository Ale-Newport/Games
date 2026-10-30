import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Recorre las treinta casillas con tus cinco piezas y sácalas todas antes que tu rival. Las
          reglas originales se perdieron; estas siguen la reconstrucción de Timothy Kendall.
        </p>
        <h3>Recorrido y tirada</h3>
        <ul>
          <li>
            Las piezas empiezan alternadas en la primera fila y avanzan en S: la primera fila de
            izquierda a derecha, la segunda de derecha a izquierda y la tercera de nuevo hacia la
            derecha.
          </li>
          <li>
            Se tiran cuatro palos: cuenta las caras claras (1–4); si no sale ninguna, vale 5. Con 1,
            4 o 5 vuelves a tirar.
          </li>
        </ul>
        <h3>Movimientos</h3>
        <ul>
          <li>
            Mueve una pieza hacia delante lo que marque la tirada; no puedes caer en una pieza tuya.
          </li>
          <li>
            Si caes en una pieza rival sola, intercambiáis los sitios. Dos piezas seguidas se
            protegen y tres seguidas no se pueden saltar.
          </li>
          <li>
            Toda pieza debe parar en la casilla 26 (la Casa de la Felicidad). Desde ahí, un 5 la
            saca; con 1–4 va a la 27–30.
          </li>
          <li>La 27 es el Agua: la pieza vuelve a la 15 (o a la primera casilla libre antes).</li>
          <li>
            Desde la 28 se sale con un 3, desde la 29 con un 2 y desde la 30 con un 1. Las casillas
            26–30 no se pueden atacar.
          </li>
          <li>Si ninguna pieza puede mover, pasa el turno.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>T</kbd> o <kbd>Espacio</kbd> tirar · toca una pieza marcada · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Bring your five pieces along the thirty squares and off before your opponent. The original
        rules are lost; these follow Timothy Kendall's reconstruction.
      </p>
      <h3>Route and throw</h3>
      <ul>
        <li>
          Pieces start alternating on the first row and travel in an S: the first row left to right,
          the second right to left, the third left to right again.
        </li>
        <li>
          Throw four sticks: count the light faces (1–4); none up counts 5. A 1, 4 or 5 gives
          another throw.
        </li>
      </ul>
      <h3>Moves</h3>
      <ul>
        <li>Move one piece forward by the throw; you cannot land on your own piece.</li>
        <li>
          Landing on a lone opposing piece swaps the two. Two pieces in a row protect each other,
          and three in a row cannot be passed.
        </li>
        <li>
          Every piece must stop on square 26 (the House of Happiness). From there a 5 bears it off;
          1–4 take it to 27–30.
        </li>
        <li>
          Square 27 is the Water: the piece goes back to 15 (or the first free square before it).
        </li>
        <li>
          A piece leaves 28 with a 3, 29 with a 2 and 30 with a 1. Squares 26–30 cannot be attacked.
        </li>
        <li>If no piece can move, the turn passes.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>T</kbd> or <kbd>Space</kbd> throw · tap a marked piece · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
