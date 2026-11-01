import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Completar filas con las piezas que caen: maratón de 150 líneas o sprint de 40 líneas lo
          antes posible.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Las piezas se giran y se desplazan mientras caen. Una fila completa desaparece; cuatro a
            la vez puntúan más.
          </li>
          <li>
            Ves las cinco piezas siguientes y puedes guardar una en reserva (una vez por pieza).
          </li>
          <li>
            La pieza fantasma marca dónde caerá. Caída rápida: cae del todo y se fija; caída suave:
            baja más deprisa.
          </li>
          <li>
            Al tocar fondo tienes medio segundo para recolocarla. Los giros en T, los combos y las
            jugadas difíciles seguidas puntúan más.
          </li>
          <li>Cada diez líneas subes de nivel y las piezas caen más rápido.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> mover · <kbd>↑</kbd> girar · <kbd>Z</kbd> girar al revés ·{' '}
          <kbd>↓</kbd> caída suave · <kbd>Espacio</kbd> caída rápida · <kbd>C</kbd> reserva ·
          botones táctiles · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Complete rows with the falling pieces: a 150-line marathon, or a 40-line sprint as fast as
        you can.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          Pieces rotate and slide as they fall. A complete row vanishes; four at once score the
          most.
        </li>
        <li>You see the next five pieces and can put one on hold (once per piece).</li>
        <li>
          The ghost piece shows where it will land. Hard drop drops and locks it; soft drop speeds
          it down.
        </li>
        <li>
          On landing you have half a second to adjust it. T-spins, combos and back-to-back difficult
          clears score extra.
        </li>
        <li>Every ten lines the level rises and the pieces fall faster.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> move · <kbd>↑</kbd> rotate · <kbd>Z</kbd> rotate back ·{' '}
        <kbd>↓</kbd> soft drop · <kbd>Space</kbd> hard drop · <kbd>C</kbd> hold · touch buttons ·{' '}
        <kbd>P</kbd> pause.
      </p>
    </>
  );
}
