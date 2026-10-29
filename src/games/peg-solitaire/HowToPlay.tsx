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
          <li>En los tableros inglés y europeo se salta en horizontal y vertical.</li>
          <li>En el triángulo se salta en sus seis direcciones (a lo largo de los tres lados).</li>
          <li>La partida acaba cuando ya no quedan saltos.</li>
        </ul>
        <h3>Tableros</h3>
        <ul>
          <li>Inglés: 33 huecos con el centro vacío; el reto clásico es acabar en el centro.</li>
          <li>Europeo: 37 huecos; empieza con un hueco del borde izquierdo vacío.</li>
          <li>Triángulo: 15 huecos con el vértice superior vacío.</li>
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
        <li>On the English and European boards jumps go across and down.</li>
        <li>On the triangle jumps go in its six directions (along its three sides).</li>
        <li>The game ends when no jump is left.</li>
      </ul>
      <h3>Boards</h3>
      <ul>
        <li>English: 33 holes with the centre empty; the classic challenge ends in the centre.</li>
        <li>European: 37 holes, starting with a hole on the left edge empty.</li>
        <li>Triangle: 15 holes with the top one empty.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a peg, then one of the highlighted holes. <kbd>U</kbd> undo · <kbd>R</kbd> restart ·{' '}
        <kbd>H</kbd> hint · <kbd>Esc</kbd> deselect.
      </p>
    </>
  );
}
