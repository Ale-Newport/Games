import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Llegar a la puerta de cada una de las ocho salas, con las menos muertes posibles.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Corre y salta; cuanto más mantengas el salto, más alto llegas.</li>
          <li>
            Pégate a una pared en el aire para deslizarte despacio, y salta para impulsarte en
            sentido contrario.
          </li>
          <li>
            Una vez en cada salto puedes hacer un dash en la dirección que marques (izquierda,
            derecha, arriba o en diagonal). El farolillo se apaga hasta que vuelves a pisar suelo.
          </li>
          <li>Los muelles te lanzan muy alto y te devuelven el dash.</li>
          <li>
            Tocar un pincho es morir, pero solo vuelves al inicio de la sala. Cada sala vale 1000
            puntos, cada muerte resta 25, y terminar las ocho en diez minutos suma 10 por segundo
            sobrante.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> corren · <kbd>Espacio</kbd> salta · <kbd>X</kbd> o{' '}
          <kbd>Mayús</kbd> hace dash (con <kbd>↑</kbd> para apuntar arriba) · <kbd>P</kbd> pausa ·{' '}
          <kbd>R</kbd> reinicia · o el panel táctil.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Reach the door of each of the eight rooms, with as few deaths as you can.</p>
      <h3>How to play</h3>
      <ul>
        <li>Run and jump; the longer you hold jump, the higher you go.</li>
        <li>
          Press against a wall in mid-air to slide down slowly, and jump to kick off the other way.
        </li>
        <li>
          Once per jump you can dash in the direction you hold (left, right, up or diagonally). The
          lantern goes dark until you touch the ground again.
        </li>
        <li>Springs throw you high and give your dash back.</li>
        <li>
          Touching a spike is death, but it only sends you back to the room’s start. Each room is
          worth 1000 points, each death −25, and clearing all eight within ten minutes adds 10 a
          second left.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> run · <kbd>Space</kbd> jumps · <kbd>X</kbd> or <kbd>Shift</kbd>{' '}
        dashes (with <kbd>↑</kbd> to aim up) · <kbd>P</kbd> pause · <kbd>R</kbd> restart · or the
        touch pad.
      </p>
    </>
  );
}
