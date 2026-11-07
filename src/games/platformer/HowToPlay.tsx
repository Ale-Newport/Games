import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Llegar a la bandera al final de cada uno de los tres niveles.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Corre con inercia y salta; cuanto más mantengas el salto, más alto llegas.</li>
          <li>
            Cae encima de un escarabajo para aplastarlo (100 puntos); los rojos con pinchos no se
            pueden aplastar. Tocar uno de lado cuesta una vida.
          </li>
          <li>
            Golpea las cajas sorpresa desde abajo: dan monedas (100 monedas son una vida) o una baya
            que te protege de un golpe.
          </li>
          <li>
            Los fosos y que se acabe el tiempo cuestan una vida; tras el punto de control, vuelves a
            él.
          </li>
          <li>La bandera da 1000 puntos y 10 más por cada segundo que sobre.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas o <kbd>A</kbd>/<kbd>D</kbd> para correr · <kbd>Espacio</kbd> o <kbd>↑</kbd> salta
          · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia · o el panel táctil.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Reach the flag at the end of each of the three levels.</p>
      <h3>How to play</h3>
      <ul>
        <li>Run with momentum and jump; the longer you hold jump, the higher you go.</li>
        <li>
          Land on a beetle to squash it (100 points); the red spiky ones can’t be squashed. Touching
          one from the side costs a life.
        </li>
        <li>
          Head-butt prize boxes from below: they hold coins (100 coins are a life) or a berry that
          shields you from one hit.
        </li>
        <li>
          Pits and running out of time cost a life; past the checkpoint, you start again there.
        </li>
        <li>The flag is worth 1000 points plus 10 for every second left.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows or <kbd>A</kbd>/<kbd>D</kbd> to run · <kbd>Space</kbd> or <kbd>↑</kbd> jumps ·{' '}
        <kbd>P</kbd> pause · <kbd>R</kbd> restart · or the touch pad.
      </p>
    </>
  );
}
