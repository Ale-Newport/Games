import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Lleva tus cuatro piezas desde el centro, bajando por el centro de tu brazo, alrededor de
          toda la cruz y de vuelta por tu brazo hasta el centro. Con cuatro jugadores, los brazos
          opuestos son compañeros: ganan cuando los dos han llegado.
        </p>
        <h3>La tirada</h3>
        <p>
          Se tiran seis cauris y se cuentan las bocas hacia arriba: de 2 a 6 valen su número, una
          sola vale 10 y ninguna vale 25. El 6, el 10 y el 25 son tiradas de gracia: dan otra tirada
          y son las únicas que entran una pieza en juego.
        </p>
        <h3>Movimientos</h3>
        <ul>
          <li>
            Mueve una pieza lo que valga la tirada; para llegar al centro hace falta la tirada
            exacta.
          </li>
          <li>
            Caer sobre una pieza rival la devuelve al centro y da otra tirada, salvo en los
            castillos (★) y sobre dos piezas juntas.
          </li>
          <li>Las piezas del compañero nunca se capturan.</li>
          <li>Si ninguna pieza puede mover, pasa el turno.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · toca una pieza marcada o pulsa <kbd>1</kbd>–
          <kbd>4</kbd> · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Bring your four pieces from the centre down the middle of your arm, round the whole cross
        and back up your arm to the centre. With four players, opposite arms are partners: they win
        when both are home.
      </p>
      <h3>The throw</h3>
      <p>
        Throw six cowrie shells and count the mouths up: two to six count their number, one alone
        counts 10 and none counts 25. The 6, 10 and 25 are grace throws: they give another throw and
        are the only ones that bring a piece into play.
      </p>
      <h3>Moves</h3>
      <ul>
        <li>Move a piece by the throw; reaching the centre needs the exact throw.</li>
        <li>
          Landing on a rival piece sends it back to the centre and gives another throw, except on
          the castles (★) and on two pieces together.
        </li>
        <li>A partner's pieces are never captured.</li>
        <li>If no piece can move, the turn passes.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> throw · tap a marked piece or press <kbd>1</kbd>–
        <kbd>4</kbd> · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
