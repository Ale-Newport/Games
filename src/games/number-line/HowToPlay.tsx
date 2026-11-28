import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada línea es un indicador del Banco Mundial en un año, con{' '}
          <b>tres países de referencia</b> ya colocados (uno bajo, uno medio y uno alto). Coloca los{' '}
          <b>tres países misteriosos</b> donde crees que están.
        </p>
        <h3>La línea</h3>
        <p>
          Lineal para porcentajes, tasas y demás; <b>logarítmica</b> cuando los valores abarcan
          varios órdenes de magnitud (dinero, población…): cada marca es diez veces la anterior.
        </p>
        <h3>Puntuación</h3>
        <p>
          Cada país puntúa 100 · e^(−d / 0,1), donde d es la distancia a su posición real como
          fracción de la línea: a un 2 % de la línea, 82; a un 5 %, 61; a un 10 %, 37. Los puntos de
          la línea son la media de los tres (máximo 100).
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco líneas (economía, población, salud, medio ambiente, tecnología), las
          mismas para todos (máximo 500). <b>Sin fin</b>: tema y dificultad a elegir (los países
          misteriosos salen de los 60 más poblados, de los 120 o de todos).
        </p>
        <h3>Controles</h3>
        <p>
          Elige un país (botón o tecla <kbd>1</kbd>–<kbd>3</kbd>) y toca la línea, o arrastra su
          marcador. Con un marcador enfocado: <kbd>←</kbd>/<kbd>→</kbd> lo mueven (<kbd>Mayús</kbd>{' '}
          más), <kbd>Inicio</kbd>/<kbd>Fin</kbd> a los extremos. <kbd>Intro</kbd> fija.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each line is one World Bank indicator in one year, with <b>three reference countries</b>{' '}
        already placed (a low one, a middle one and a high one). Put the{' '}
        <b>three mystery countries</b> where you think they belong.
      </p>
      <h3>The line</h3>
      <p>
        Linear for percentages, rates and the like; <b>logarithmic</b> when the values span several
        orders of magnitude (money, population…): each tick is ten times the one before.
      </p>
      <h3>Scoring</h3>
      <p>
        Each country scores 100 · e^(−d / 0.1), where d is its distance from the true position as a
        share of the line: 2 % of the line away, 82; 5 %, 61; 10 %, 37. The line scores the average
        of the three (at most 100).
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five lines (economy, people, health, environment, technology), the same for
        everyone (500 max). <b>Endless</b>: pick a topic and difficulty (mystery countries from the
        60 most populous, the 120 most populous, or all).
      </p>
      <h3>Controls</h3>
      <p>
        Choose a country (button or key <kbd>1</kbd>–<kbd>3</kbd>) and tap the line, or drag its
        pin. With a pin focused: <kbd>←</kbd>/<kbd>→</kbd> move it (<kbd>Shift</kbd> further),{' '}
        <kbd>Home</kbd>/<kbd>End</kbd> to the ends. <kbd>Enter</kbd> locks in.
      </p>
    </>
  );
}
