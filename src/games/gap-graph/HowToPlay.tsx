import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada gráfica es un dato real del Banco Mundial al que le faltan <b>tres valores</b>.
          Rellénalos.
        </p>
        <h3>Dos tipos de gráfica, por turnos</h3>
        <ul>
          <li>
            <b>Línea</b>: un país durante 12–20 años; faltan tres años intermedios, siempre incluido
            el que más se aparta de la recta entre sus vecinos.
          </li>
          <li>
            <b>Barras</b>: ocho países en un mismo año; faltan tres barras.
          </li>
        </ul>
        <h3>Cómo se juega</h3>
        <p>
          Arrastra cada hueco arriba o abajo (en cualquier punto de su columna), o con el teclado:{' '}
          <kbd>Tab</kbd> hasta el hueco, <kbd>↑</kbd>/<kbd>↓</kbd> lo mueven un 1 % (
          <kbd>Mayús</kbd> 5 %), <kbd>Inicio</kbd>/<kbd>Fin</kbd> a los extremos. <kbd>Intro</kbd>{' '}
          fija la gráfica.
        </p>
        <h3>Puntuación</h3>
        <p>
          Cada hueco puntúa 100 · e^(−d / 0,1), donde d es el error como fracción de la altura de la
          gráfica (1 % → 90; 5 % → 61; 10 % → 37). La gráfica puntúa la media de los tres.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco gráficas, una por tema, las mismas para todos (máximo 500).{' '}
          <b>Sin fin</b>: tema y dificultad a elegir.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each chart is real World Bank data with <b>three values</b> missing. Fill them in.
      </p>
      <h3>Two kinds of chart, in turn</h3>
      <ul>
        <li>
          <b>Line</b>: one country over 12–20 years; three inner years are missing, always including
          the one that strays most from the straight line between its neighbours.
        </li>
        <li>
          <b>Bars</b>: eight countries in one year; three bars are missing.
        </li>
      </ul>
      <h3>Play</h3>
      <p>
        Drag each gap up or down (anywhere in its column), or with the keyboard: <kbd>Tab</kbd> to a
        gap, <kbd>↑</kbd>/<kbd>↓</kbd> move it 1 % (<kbd>Shift</kbd> 5 %), <kbd>Home</kbd>/
        <kbd>End</kbd> to the ends. <kbd>Enter</kbd> locks the chart.
      </p>
      <h3>Scoring</h3>
      <p>
        Each gap scores 100 · e^(−d / 0.1), where d is the error as a share of the chart height (1 %
        → 90; 5 % → 61; 10 % → 37). The chart scores the average of the three.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five charts, one per topic, the same for everyone (500 max). <b>Endless</b>:
        pick a topic and difficulty.
      </p>
    </>
  );
}
