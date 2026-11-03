import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Subir lo más alto posible rebotando de nube en nube.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La escaladora rebota sola cada vez que cae sobre una nube; solo la guías a izquierda y
            derecha.
          </li>
          <li>Los lados de la pantalla se conectan: sal por uno y entrarás por el otro.</li>
          <li>Las nubes solo la sostienen desde arriba: al subir las atraviesa.</li>
          <li>
            Las nubes lilas se desplazan; las finas (con borde punteado) se deshacen sin rebote; un
            muelle la lanza mucho más alto.
          </li>
          <li>
            Cae encima de un duende de tormenta para hacerlo estallar; tocarlo de otra forma acaba
            la partida, igual que caer por debajo de la vista.
          </li>
          <li>La puntuación es la altura máxima en metros.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> (o el panel) la mueven · o señala con el dedo adónde ir ·{' '}
          <kbd>P</kbd> pausa ·<kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Climb as high as you can by bouncing from cloud to cloud.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The climber bounces by herself every time she lands on a cloud; you only steer her left
          and right.
        </li>
        <li>The sides of the screen wrap round: leave by one, come back by the other.</li>
        <li>Clouds only hold her from above: she rises straight through them.</li>
        <li>
          Lavender clouds drift; thin ones (dotted edge) burst without a bounce; a spring launches
          her far higher.
        </li>
        <li>
          Land on a storm sprite to pop it; touching it any other way ends the climb, as does
          dropping below the view.
        </li>
        <li>The score is the greatest height in metres.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> (or the pad) steer · or point a finger where to go · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
