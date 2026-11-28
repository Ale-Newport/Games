import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada ronda es una gráfica de dispersión real: dos indicadores del Banco Mundial (por
          ejemplo PIB por habitante y esperanza de vida) para todos los países en un año. Faltan
          unos pocos países: colócalos donde creas que van.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Elige un país en las fichas de abajo y toca o arrastra en la gráfica para colocarlo;
            luego pasa al siguiente. Puedes volver a arrastrar cualquier marcador.
          </li>
          <li>
            Los puntos grises son los demás países (pasa el ratón para ver el nombre; los seis más
            poblados llevan etiqueta). Fíjate en las escalas: algunas son logarítmicas.
          </li>
          <li>
            Puntuación de cada país: 100 × e^(−d / 0,15), donde d es la distancia entre tu marcador
            y la posición real con la gráfica medida como un cuadrado de lado 1. La ronda vale la
            media.
          </li>
          <li>
            Tras enviar, aparecen las posiciones reales y los intentos del ordenador, que busca los
            cinco países más parecidos en otros indicadores y lo coloca entre ellos.
          </li>
        </ul>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco gráficas normales, las mismas para todos. <b>Sin fin</b>: fácil (tres
          países de 30 millones de habitantes o más), normal (cuatro de 8 millones o más) o difícil
          (cinco cualesquiera).
        </p>
        <h3>Controles</h3>
        <p>
          Ratón o dedo. Teclado (gráfica enfocada): flechas mueven el país elegido (<kbd>Mayús</kbd>{' '}
          ×5), <kbd>Tab</kbd> pasa al siguiente, <kbd>Intro</kbd> envía.
        </p>
        <h3>Datos</h3>
        <p>
          Indicadores del Desarrollo Mundial del Banco Mundial (CC BY 4.0): 18 parejas de
          indicadores, años con al menos 60 países con ambos datos.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Every round is a real scatter chart: two World Bank indicators (say GDP per person and life
        expectancy) for every country in one year. A few countries are missing — place them where
        you think they belong.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          Pick a country from the chips below and tap or drag on the chart to place it; then move on
          to the next. Any marker can be dragged again.
        </li>
        <li>
          The grey dots are the other countries (hover for names; the six most populous are
          labelled). Mind the scales: some are logarithmic.
        </li>
        <li>
          Each country scores 100 × e^(−d / 0.15), where d is the distance between your marker and
          the true position on a chart measured as a unit square. The round is worth the average.
        </li>
        <li>
          After submitting you see the true positions and the computer's attempt: it finds the five
          countries most alike on other indicators and places the country among them.
        </li>
      </ul>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five Normal charts, the same for everyone. <b>Endless</b>: Easy (three
        countries of 30 million people or more), Normal (four of 8 million or more) or Hard (any
        five).
      </p>
      <h3>Controls</h3>
      <p>
        Mouse or finger. Keyboard (chart focused): arrows move the selected country (
        <kbd>Shift</kbd> ×5), <kbd>Tab</kbd> moves to the next, <kbd>Enter</kbd> submits.
      </p>
      <h3>Data</h3>
      <p>
        World Bank World Development Indicators (CC BY 4.0): 18 indicator pairs, years with at least
        60 countries reporting both values.
      </p>
    </>
  );
}
