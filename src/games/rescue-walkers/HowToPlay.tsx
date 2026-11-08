import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llevar a la puerta de salida al menos a los caminantes que pide cada nivel (seis niveles).
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Los caminantes caen de la trampilla y andan solos: se dan la vuelta en las paredes,
            suben escalones de uno o dos bloques y caen por los bordes.
          </li>
          <li>Una caída larga o el agua son mortales.</li>
          <li>
            Elige una habilidad en la barra de abajo y toca a un caminante para dársela. Cada nivel
            trae un número limitado de cada una.
          </li>
          <li>
            <b>Trepador</b> sube paredes · <b>Flotador</b> cae despacio con paraguas ·{' '}
            <b>Bloqueador</b> se planta y hace dar la vuelta a los demás · <b>Excavador</b> cava
            hacia abajo · <b>Perforador</b> abre un túnel hacia delante · <b>Constructor</b> pone
            doce escalones hacia arriba.
          </li>
          <li>La tierra se puede cavar y perforar; el acero gris no.</li>
          <li>
            Un nivel fallido cuesta un intento (hay tres). «Terminar nivel» lo acaba antes de
            tiempo.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca la barra para elegir habilidad y a un caminante para dársela · teclado: <kbd>←</kbd>/
          <kbd>→</kbd> habilidad, <kbd>↑</kbd>/<kbd>↓</kbd> caminante resaltado, <kbd>Espacio</kbd>{' '}
          dar, <kbd>Mayús</kbd> terminar nivel · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Bring at least as many wanderers to the exit door as each level asks (six levels).</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Wanderers drop from the hatch and walk on their own: they turn at walls, climb steps of
          one or two blocks and fall off edges.
        </li>
        <li>A long fall or water is fatal.</li>
        <li>
          Pick a skill on the bar below and tap a wanderer to give it. Each level brings a limited
          number of each.
        </li>
        <li>
          <b>Climber</b> scales walls · <b>Floater</b> drifts down under an umbrella ·{' '}
          <b>Blocker</b> stands still and turns the others round · <b>Digger</b> digs down ·{' '}
          <b>Basher</b> tunnels forward · <b>Builder</b> lays twelve steps up.
        </li>
        <li>Earth can be dug and bashed; grey steel cannot.</li>
        <li>A failed level costs a try (there are three). “End level” finishes it early.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap the bar to pick a skill and a wanderer to give it · keys: <kbd>←</kbd>/<kbd>→</kbd>{' '}
        skill, <kbd>↑</kbd>/<kbd>↓</kbd> highlighted wanderer, <kbd>Space</kbd> give,{' '}
        <kbd>Shift</kbd> end level · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
