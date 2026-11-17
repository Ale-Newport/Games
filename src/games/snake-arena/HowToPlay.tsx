import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Crecer todo lo posible sin chocar. Tu puntuación es la mayor longitud que alcances.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Tu serpiente avanza siempre; tú solo eliges hacia dónde gira (con un giro limitado).
          </li>
          <li>Las bolitas brillantes te dan masa: te haces más larga y más gruesa.</li>
          <li>
            El turbo duplica la velocidad pero gasta masa, que dejas atrás en bolitas pequeñas. Solo
            puedes usarlo con longitud 12 o más.
          </li>
          <li>
            Si tu cabeza toca el cuerpo de otra serpiente o el muro rojo, mueres. Si otra serpiente
            choca contra tu cuerpo, muere ella y su cuerpo se convierte en un rastro de bolitas
            grandes.
          </li>
          <li>Las serpientes bot que mueren son sustituidas por otras nuevas.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Mueve el ratón sobre la arena para dirigir y mantén pulsado el botón para el turbo · en
          móvil, arrastra el dedo y usa el botón de turbo · <kbd>←</kbd>/<kbd>→</kbd> giran,{' '}
          <kbd>↑</kbd> o <kbd>Espacio</kbd> turbo · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Grow as long as you can without crashing. Your score is the longest you get.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Your snake always moves forward; you only choose where it turns (at a limited rate).
        </li>
        <li>Glowing pellets add mass: you get longer and thicker.</li>
        <li>
          Boosting doubles your speed but burns mass, left behind as small pellets. You need a
          length of 12 or more to boost.
        </li>
        <li>
          If your head touches another snake’s body or the red wall, you die. If another snake runs
          into your body, it dies and its body turns into a trail of big pellets.
        </li>
        <li>Bot snakes that die are replaced by new ones.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Move the mouse over the arena to steer and hold the button to boost · on phones drag a
        finger and use the boost button · <kbd>←</kbd>/<kbd>→</kbd> turn, <kbd>↑</kbd> or{' '}
        <kbd>Space</kbd> boost · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
