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
        <h3>Cinco jugadas</h3>
        <p>Cada jugada vence a dos y pierde contra dos:</p>
        <ul>
          <li>La piedra rompe la tijera y aplasta al lagarto.</li>
          <li>El papel envuelve la piedra y encierra al mago en un pergamino.</li>
          <li>La tijera corta el papel y le corta la cola al lagarto.</li>
          <li>El lagarto se come el papel y muerde al mago.</li>
          <li>El mago derrite la piedra y hechiza la tijera.</li>
        </ul>
        <h3>Leer y ser leído</h3>
        <p>
          El ordenador decide solo con las rondas ya jugadas. El Lector de mentes prueba muchas
          predicciones a la vez; tras cada ronda puedes ver qué leyó en ti, y la pista le hace lo
          mismo a él.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una jugada · <kbd>1</kbd>–<kbd>5</kbd> piedra, mago, papel, lagarto, tijera ·{' '}
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
      <h3>Five throws</h3>
      <p>Each throw beats two and loses to two:</p>
      <ul>
        <li>Rock crushes scissors and squashes the lizard.</li>
        <li>Paper covers rock and binds the wizard in a scroll.</li>
        <li>Scissors cut paper and snip the lizard’s tail.</li>
        <li>The lizard eats paper and bites the wizard.</li>
        <li>The wizard melts rock and enchants scissors.</li>
      </ul>
      <h3>Reading and being read</h3>
      <p>
        The computer decides from the finished rounds only. The Mind reader tries many predictions
        at once; after each round you can see what it read in you, and the hint does the same to it.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a throw · <kbd>1</kbd>–<kbd>5</kbd> rock, wizard, paper, lizard, scissors · <kbd>H</kbd>{' '}
        hint.
      </p>
    </>
  );
}
