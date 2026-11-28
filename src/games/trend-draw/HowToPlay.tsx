import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada gráfica es un indicador del Banco Mundial para un país durante 15–40 años, pero solo
          ves su <b>primer punto</b>. La línea punteada es <b>el mundo</b> en esos mismos años.
          Dibuja la línea del país entera.
        </p>
        <h3>Cómo se juega</h3>
        <p>
          Dibuja a mano alzada desde el primer punto hasta el último año (puedes repasar trazos), o
          con el teclado: <kbd>←</kbd>/<kbd>→</kbd> eligen año, <kbd>↑</kbd>/<kbd>↓</kbd> fijan su
          valor (<kbd>Mayús</kbd> más rápido), <kbd>Intro</kbd> envía. Los años sin dibujar se unen
          en línea recta.
        </p>
        <h3>Puntuación</h3>
        <p>
          Distancia media entre tu línea y la real, como fracción de la altura de la gráfica: un 1 %
          da 90 puntos; un 5 %, 61; un 10 %, 37. Después ves la línea real y la de un ordenador que
          promedia la evolución de los ocho países que empezaron en el nivel más parecido.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco gráficas, una por tema, las mismas para todos (máximo 500).{' '}
          <b>Sin fin</b>: tema y dificultad (15–20 años de indicadores suaves; 20–30; 25–40, también
          volátiles).
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each chart is one World Bank indicator for one country over 15–40 years, but you see only
        its <b>first point</b>. The dotted line is <b>the world</b> over the same years. Draw the
        country’s whole line.
      </p>
      <h3>Play</h3>
      <p>
        Draw freehand from the first point to the last year (you can redraw over strokes), or with
        the keyboard: <kbd>←</kbd>/<kbd>→</kbd> pick a year, <kbd>↑</kbd>/<kbd>↓</kbd> set its value
        (<kbd>Shift</kbd> faster), <kbd>Enter</kbd> submits. Years you skip are joined with straight
        lines.
      </p>
      <h3>Scoring</h3>
      <p>
        The average gap between your line and the real one, as a share of the chart height: 1 %
        gives 90 points; 5 %, 61; 10 %, 37. Then you see the real line and a computer’s, which
        averages how the eight countries that started at the most similar level went.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five charts, one per topic, the same for everyone (500 max). <b>Endless</b>:
        topic and difficulty (15–20 years of smooth indicators; 20–30; 25–40, volatile ones too).
      </p>
    </>
  );
}
