import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Subir por las vigas hasta el gatito de arriba sin que te alcance un bidón.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Camina por las vigas y sube por las escaleras enteras; las rotas solo las usan los
            bidones.
          </li>
          <li>
            El robot de arriba lanza bidones que ruedan cuesta abajo, caen a la viga siguiente y a
            veces bajan por una escalera.
          </li>
          <li>
            Salta un bidón para ganar 100 puntos. Si te toca uno, o caes desde muy alto, pierdes una
            vida.
          </li>
          <li>
            Coge un martillo para aplastar bidones (300 puntos) durante diez segundos; mientras, no
            puedes saltar ni subir escaleras.
          </li>
          <li>
            El bonus baja con el tiempo: llegar al gatito te lo da y empieza un nivel más rápido. Si
            llega a cero, pierdes una vida. Tres vidas; una más a los 10 000 puntos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas o <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> para andar y subir ·{' '}
          <kbd>Espacio</kbd> salta · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia · o el panel táctil.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Climb the girders to the kitten at the top without being hit by a drum.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Walk along the girders and climb the whole ladders; the broken ones are for drums only.
        </li>
        <li>
          The robot at the top throws drums that roll downhill, drop to the next girder and
          sometimes take a ladder down.
        </li>
        <li>Jump a drum for 100 points. Touch one, or fall too far, and you lose a life.</li>
        <li>
          Grab a hammer to smash drums (300 points) for ten seconds; meanwhile you can neither jump
          nor climb.
        </li>
        <li>
          The bonus counts down: reaching the kitten wins it and starts a faster level. If it
          reaches zero you lose a life. Three lives; one more at 10 000 points.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows or <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> to walk and climb ·{' '}
        <kbd>Space</kbd> jumps · <kbd>P</kbd> pause · <kbd>R</kbd> restart · or the touch pad.
      </p>
    </>
  );
}
