import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ganar antes que el ordenador el número de rondas elegido (3, 5 o 10). Los empates no
          cuentan.
        </p>
        <h3>Una ronda</h3>
        <ul>
          <li>
            Las dos jugadas se sacan a la vez: el ordenador decide solo con las rondas ya jugadas,
            nunca con la tuya.
          </li>
          <li>
            El papel envuelve la piedra, la tijera corta el papel y la piedra rompe la tijera.
          </li>
        </ul>
        <h3>Leer y ser leído</h3>
        <p>
          Jugar al azar no se puede vencer, pero las personas tenemos costumbres. El Lector de
          mentes prueba muchas predicciones a la vez y se fía de la que acierta; tras cada ronda
          puedes ver qué leyó en ti. La pista hace lo mismo con él.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una jugada · <kbd>1</kbd> piedra · <kbd>2</kbd> papel · <kbd>3</kbd> tijera ·{' '}
          <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Win the chosen number of rounds (3, 5 or 10) before the computer does. Ties do not count.
      </p>
      <h3>A round</h3>
      <ul>
        <li>
          You both throw at once: the computer decides from the finished rounds only, never from
          your throw.
        </li>
        <li>Paper covers rock, scissors cut paper and rock crushes scissors.</li>
      </ul>
      <h3>Reading and being read</h3>
      <p>
        Random throws cannot be beaten, but people have habits. The Mind reader tries many
        predictions at once and trusts whichever has been right; after each round you can see what
        it read in you. The hint does the same to it.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a throw · <kbd>1</kbd> rock · <kbd>2</kbd> paper · <kbd>3</kbd> scissors · <kbd>H</kbd>{' '}
        hint.
      </p>
    </>
  );
}
