import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Completar todas las filas que puedas antes de que el pozo se llene.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Las piezas se giran y se desplazan mientras caen; una fila completa desaparece.</li>
          <li>
            Solo ves la pieza siguiente. No hay reserva, ni caída rápida, ni «patadas» al girar
            junto a una pared.
          </li>
          <li>Puntos: 40, 100, 300 o 1200 por una, dos, tres o cuatro filas, por (nivel + 1).</li>
          <li>
            Empieza en el nivel 0, 9 o 18; la velocidad sigue la tabla clásica y sube con las
            líneas.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> mover (mantener repite) · <kbd>↑</kbd> girar · <kbd>Z</kbd>{' '}
          girar al revés · <kbd>↓</kbd> caída suave · botones táctiles · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Clear as many rows as you can before the well fills up.</p>
      <h3>How to play</h3>
      <ul>
        <li>Pieces rotate and slide as they fall; a complete row vanishes.</li>
        <li>
          You see only the next piece. There is no hold, no hard drop and no wall kicks when turning
          against a wall.
        </li>
        <li>Points: 40, 100, 300 or 1200 for one, two, three or four rows, times (level + 1).</li>
        <li>
          Start at level 0, 9 or 18; the speed follows the classic table and rises with your lines.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> move (hold to repeat) · <kbd>↑</kbd> rotate · <kbd>Z</kbd> rotate
        back · <kbd>↓</kbd> soft drop · touch buttons · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
