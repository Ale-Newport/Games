import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Reunir todos los orbes de estrella y llevarlos al campanario de la aldea: cada uno
          enciende una estrella nueva en el cielo.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Pedalea por las colinas: cuesta abajo ganas velocidad y cuesta arriba la pierdes. Las
            casas, la iglesia y los cipreses se rodean.
          </li>
          <li>
            Pasa junto a un orbe para cogerlo; algunos flotan alto y hay que saltar para
            alcanzarlos.
          </li>
          <li>Entrega los que lleves entrando en el círculo dorado al pie del campanario.</li>
          <li>
            Mantén E en el aire para girar: una vuelta completa antes de aterrizar puntúa (más si
            encadenas dos); aterrizar a medio giro es un tropiezo.
          </li>
          <li>Con F te bajas y caminas (más despacio, giras mejor).</li>
          <li>
            Modos: Luz de estrellas (12 orbes), Constelación (24) y Paseo libre (sin final). Puntos:
            500 por estrella, las piruetas y una bonificación por terminar rápido.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>W</kbd>/<kbd>↑</kbd> pedalear · <kbd>S</kbd>/<kbd>↓</kbd> frenar · <kbd>A</kbd>/
          <kbd>D</kbd> girar · <kbd>Espacio</kbd> saltar · <kbd>E</kbd> girar en el aire ·{' '}
          <kbd>F</kbd> caminar · <kbd>P</kbd> pausa. En móvil, botones táctiles.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Gather every star orb and carry them to the village steeple: each one lights a new star in
        the sky.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          Pedal over the hills: downhill speeds you up and uphill slows you down. Ride round the
          cottages, the church and the cypresses.
        </li>
        <li>Ride past an orb to pick it up; some float high and need a leap to reach.</li>
        <li>Deliver what you carry by entering the golden circle at the foot of the steeple.</li>
        <li>
          Hold E in the air to spin: a full turn before landing scores (more for two); landing
          mid-spin is a tumble.
        </li>
        <li>F gets off the bike to walk (slower, tighter turns).</li>
        <li>
          Modes: Starlight (12 orbs), Constellation (24) and Free ride (no end). Points: 500 per
          star, the tricks, and a bonus for finishing fast.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>W</kbd>/<kbd>↑</kbd> pedal · <kbd>S</kbd>/<kbd>↓</kbd> brake · <kbd>A</kbd>/
        <kbd>D</kbd> steer · <kbd>Space</kbd> leap · <kbd>E</kbd> spin in the air · <kbd>F</kbd>{' '}
        walk · <kbd>P</kbd> pause. Touch buttons on phones.
      </p>
    </>
  );
}
