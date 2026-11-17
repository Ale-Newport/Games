import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Acertar seguidas tantas veces como puedas si el número oculto es mayor o menor que el
          visible.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            A la izquierda ves algo con su número; a la derecha, otra cosa de la misma categoría con
            el número oculto.
          </li>
          <li>
            Elige «Más» o «Menos». Si aciertas (un empate vale para las dos), sumas un punto y la
            carta de la derecha pasa a la izquierda.
          </li>
          <li>Al primer fallo termina la partida.</li>
          <li>
            Categorías: población y superficie de países, altura de montañas, longitud de ríos
            (aproximada) y peso de animales (adulto típico, aproximado). En «Mezcla» cambia cada
            cinco cartas.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Botones o <kbd>↑</kbd>/<kbd>H</kbd> para «Más» y <kbd>↓</kbd>/<kbd>L</kbd> para «Menos».
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Guess, as many times in a row as you can, whether the hidden number is higher or lower than
        the shown one.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          On the left is something with its number; on the right, another thing from the same
          category with its number hidden.
        </li>
        <li>
          Pick Higher or Lower. A right guess (a tie counts both ways) scores a point and the right
          card moves to the left.
        </li>
        <li>The first wrong guess ends the run.</li>
        <li>
          Categories: country population and area, mountain heights, river lengths (approximate) and
          animal weights (typical adult, approximate). Mix changes category every five cards.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Buttons, or <kbd>↑</kbd>/<kbd>H</kbd> for Higher and <kbd>↓</kbd>/<kbd>L</kbd> for Lower.
      </p>
    </>
  );
}
