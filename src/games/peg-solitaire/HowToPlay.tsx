import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Retira clavijas saltando hasta que quede una sola.</p>
        <h3>Saltos</h3>
        <ul>
          <li>
            Una clavija salta en línea recta sobre una clavija vecina y cae en el hueco vacío justo
            detrás; la clavija saltada se retira.
          </li>
          <li>
            En los tableros inglés, europeo, alemán, asimétrico y diamante se salta en horizontal y
            vertical.
          </li>
          <li>
            En los triángulos y el hexágono se salta en seis direcciones (a lo largo de las tres
            líneas de la red triangular).
          </li>
          <li>La partida acaba cuando ya no quedan saltos.</li>
        </ul>
        <h3>Tableros</h3>
        <ul>
          <li>Inglés: 33 huecos con el centro vacío; el reto clásico es acabar en el centro.</li>
          <li>Europeo: 37 huecos; empieza con un hueco del borde izquierdo vacío.</li>
          <li>Alemán: 45 huecos, una cruz de brazos de tres por tres; del centro al centro.</li>
          <li>
            Asimétrico (3-3-2-2): 39 huecos, dos brazos de tres filas y dos de dos; del centro al
            centro.
          </li>
          <li>
            Diamante: 41 huecos; empieza vacío el hueco dos por encima del centro y termina dos por
            debajo (desde el centro no se puede acabar con una).
          </li>
          <li>Triángulo: 15 huecos con el vértice superior vacío.</li>
          <li>Triángulo grande: 21 huecos; empieza y termina en el vértice superior.</li>
          <li>
            Hexágono: 37 huecos; empieza vacío el hueco a la izquierda del centro y termina en el de
            su derecha.
          </li>
          <li>Cuando hay un hueco meta, aparece rodeado por un anillo claro.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una clavija y luego uno de los huecos resaltados. <kbd>U</kbd> deshacer ·{' '}
          <kbd>R</kbd> reiniciar · <kbd>H</kbd> pista · <kbd>Esc</kbd> deseleccionar.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Remove pegs by jumping until only one is left.</p>
      <h3>Jumps</h3>
      <ul>
        <li>
          A peg jumps in a straight line over a neighbouring peg into the empty hole just beyond it;
          the jumped peg is removed.
        </li>
        <li>
          On the English, European, German, asymmetric and diamond boards jumps go across and down.
        </li>
        <li>
          On the triangles and the hexagon jumps go in six directions (along the three lines of the
          triangular lattice).
        </li>
        <li>The game ends when no jump is left.</li>
      </ul>
      <h3>Boards</h3>
      <ul>
        <li>English: 33 holes with the centre empty; the classic challenge ends in the centre.</li>
        <li>European: 37 holes, starting with a hole on the left edge empty.</li>
        <li>German: 45 holes, a cross with three-by-three arms; centre to centre.</li>
        <li>
          Asymmetric (3-3-2-2): 39 holes, two arms three rows long and two arms two long; centre to
          centre.
        </li>
        <li>
          Diamond: 41 holes; the hole two above the centre starts empty and the last peg must end
          two below it (from the centre no single-peg finish exists).
        </li>
        <li>Triangle: 15 holes with the top one empty.</li>
        <li>Big triangle: 21 holes; start and finish on the top hole.</li>
        <li>
          Hexagon: 37 holes; the hole left of the centre starts empty and the last peg must end on
          the one right of it.
        </li>
        <li>When a board has a goal hole it wears a light ring.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a peg, then one of the highlighted holes. <kbd>U</kbd> undo · <kbd>R</kbd> restart ·{' '}
        <kbd>H</kbd> hint · <kbd>Esc</kbd> deselect.
      </p>
    </>
  );
}
