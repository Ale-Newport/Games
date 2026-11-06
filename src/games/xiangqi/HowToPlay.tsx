import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Da <strong>jaque mate</strong> al general rival. Rojo (abajo) mueve primero. Las piezas se
          colocan en las intersecciones.
        </p>
        <h3>Piezas</h3>
        <ul>
          <li>
            <strong>General</strong> (帥/將): un paso en ortogonal, sin salir del palacio (el cuadro
            con aspas). <strong>Consejero</strong> (仕/士): un paso en diagonal dentro del palacio.
          </li>
          <li>
            <strong>Elefante</strong> (相/象): dos pasos en diagonal; se bloquea si el punto
            intermedio está ocupado y nunca cruza el río.
          </li>
          <li>
            <strong>Caballo</strong> (傌/馬): un paso recto y otro en diagonal hacia fuera; se
            bloquea si el punto contiguo en la dirección recta está ocupado.
          </li>
          <li>
            <strong>Carro</strong> (俥/車): como la torre. <strong>Cañón</strong> (炮/砲): se mueve
            como el carro, pero para capturar salta exactamente una pieza (de cualquier color).
          </li>
          <li>
            <strong>Soldado</strong> (兵/卒): un paso hacia delante; tras cruzar el río también
            hacia los lados. Nunca retrocede ni promociona.
          </li>
        </ul>
        <h3>Reglas especiales</h3>
        <ul>
          <li>
            Los dos generales no pueden quedar cara a cara en la misma columna sin piezas entre
            ellos.
          </li>
          <li>Quien no tiene jugadas legales pierde, esté o no en jaque.</li>
          <li>
            Triple repetición: tablas, salvo que un bando diera jaque en todas sus jugadas (pierde).
            Las reglas de persecución perpetua no están implementadas.
          </li>
          <li>
            Tablas tras 60 jugadas de cada bando sin capturas o si ya nadie tiene piezas de ataque.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza y luego su destino (puntos = jugadas, anillos = capturas).</li>
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
        <strong>Checkmate</strong> the enemy general. Red (bottom) moves first. Pieces stand on the
        intersections.
      </p>
      <h3>Pieces</h3>
      <ul>
        <li>
          <strong>General</strong> (帥/將): one step orthogonally, never leaving the palace (the
          square with the cross). <strong>Advisor</strong> (仕/士): one step diagonally inside the
          palace.
        </li>
        <li>
          <strong>Elephant</strong> (相/象): two steps diagonally; blocked if the point in between
          is occupied, and never crosses the river.
        </li>
        <li>
          <strong>Horse</strong> (傌/馬): one step straight, then one diagonally outward; blocked if
          the point next to it in the straight direction is occupied.
        </li>
        <li>
          <strong>Chariot</strong> (俥/車): like a rook. <strong>Cannon</strong> (炮/砲): moves like
          the chariot, but captures by jumping over exactly one piece of either color.
        </li>
        <li>
          <strong>Soldier</strong> (兵/卒): one step forward; after crossing the river also
          sideways. Never backward, never promotes.
        </li>
      </ul>
      <h3>Special rules</h3>
      <ul>
        <li>The two generals may never face each other on a file with nothing between them.</li>
        <li>A player with no legal move loses, in check or not.</li>
        <li>
          Threefold repetition is a draw, unless one side checked with every move (it loses).
          Perpetual-chase rules are not implemented.
        </li>
        <li>Draw after 60 moves each without a capture, or when no attacking pieces remain.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a piece, then its destination (dots = moves, rings = captures).</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
