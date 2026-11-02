import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Dejar todos los cubos de la pirámide del color objetivo (arriba a la izquierda).</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Salta en diagonal de cubo en cubo. En el nivel 1 un aterrizaje termina un cubo; en el 2
            hacen falta dos; en el 3 cada aterrizaje lo alterna, así que no repitas.
          </li>
          <li>Saltar fuera de la pirámide es caer, salvo que haya un disco: te lleva arriba.</li>
          <li>
            Las bolas rojas bajan rebotando. La morada, al llegar abajo, se convierte en un muelle
            que te persigue; si te sigue de cerca cuando subes a un disco, salta tras de ti y cae
            (500 puntos). La verde lo congela todo un rato.
          </li>
          <li>
            Cada cambio de color vale 25; cada ronda superada, 1000 o más, y 50 por cada disco sin
            usar. Tres vidas; una más cada 8000 puntos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>↑</kbd> arriba-derecha · <kbd>→</kbd> abajo-derecha · <kbd>↓</kbd> abajo-izquierda ·{' '}
          <kbd>←</kbd> arriba-izquierda (o dos flechas a la vez) · o toca junto al saltador, en el
          lado al que quieras saltar · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Turn every cube of the pyramid to the target colour (top left).</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Hop diagonally from cube to cube. On level 1 one landing finishes a cube; on level 2 it
          takes two; on level 3 each landing toggles it, so don’t go back.
        </li>
        <li>
          Hopping off the pyramid is a fall — unless a disc is there: it carries you to the top.
        </li>
        <li>
          Red balls bounce down. The purple one hatches at the bottom into a spring that chases you;
          if it is close behind when you take a disc, it jumps after you and falls (500 points). The
          green one freezes everything for a while.
        </li>
        <li>
          Each colour change is worth 25; each round cleared 1000 or more, plus 50 per unused disc.
          Three lives; one more every 8000 points.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>↑</kbd> up-right · <kbd>→</kbd> down-right · <kbd>↓</kbd> down-left · <kbd>←</kbd>{' '}
        up-left (or two arrows together) · or tap beside the hopper on the side you want to hop to ·{' '}
        <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
