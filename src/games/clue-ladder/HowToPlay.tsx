import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Adivinar cantidades reales con un solo número. Cada pregunta es una escalera de cinco
          peldaños: cuanto más subes, mejores pistas tienes, pero menos vale tu respuesta.
        </p>
        <h3>Los peldaños</h3>
        <ol>
          <li>
            <b>La pregunta</b> sola (vale ×1).
          </li>
          <li>
            <b>Dos datos relacionados</b> de la misma familia, uno menor y otro mayor (×0,75).
          </li>
          <li>
            <b>Número de cifras</b> antes de la coma (×0,55).
          </li>
          <li>
            <b>Primera cifra</b> (×0,40).
          </li>
          <li>
            <b>Una ventana estrecha</b>: dos valores un 30 % separados entre los que está la
            respuesta (×0,25).
          </li>
        </ol>
        <h3>Cómo se juega</h3>
        <p>
          En cada peldaño das una estimación y ves si la respuesta es <b>más</b> o <b>menos</b> y a
          qué distancia (a menos de un 10 %, 25 %, 50 %, ×3, o más). Entonces te <b>plantas</b> y
          puntúas, o <b>subes</b> al siguiente peldaño y vuelves a estimar. En el último peldaño la
          estimación se queda sí o sí; un acierto exacto (±2 %) también se queda al momento.
        </p>
        <h3>Puntuación</h3>
        <p>
          Precisión: 100 si te alejas un 2 % o menos; si no, 100 · e^(−1,5 · |ln(estimación /
          respuesta)|): ×1,1 da 87, ×1,5 da 54, ×2 da 35. Puntos = precisión × el valor del peldaño.
          Máximo 100 por pregunta.
        </p>
        <h3>Datos</h3>
        <p>
          Los mismos que A ojo de buen cubero: precios de materias primas del Banco Mundial
          (1960–2025), distancias entre 525 ciudades, propiedades de los elementos y datos del mundo
          de Wikidata.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco preguntas, las mismas para todos (máximo 500). <b>Sin fin</b>:
          dificultad y tema a elegir.
        </p>
        <h3>Controles</h3>
        <p>
          Ajusta la estimación con el deslizador, los botones − y + (×1,5) o escribiendo un número.
          Teclado: <kbd>←</kbd>/<kbd>→</kbd> ×1,05 (<kbd>Mayús</kbd> ×1,5), <kbd>Intro</kbd> prueba;
          luego <kbd>K</kbd> te plantas y <kbd>C</kbd> subes.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Guess real quantities with a single number. Every question is a ladder of five rungs: the
        higher you climb, the better your clues — and the less your answer is worth.
      </p>
      <h3>The rungs</h3>
      <ol>
        <li>
          <b>The question</b> alone (worth ×1).
        </li>
        <li>
          <b>Two related facts</b> from the same family, one smaller and one larger (×0.75).
        </li>
        <li>
          <b>Number of digits</b> before the decimal point (×0.55).
        </li>
        <li>
          <b>Leading digit</b> (×0.40).
        </li>
        <li>
          <b>A narrow window</b>: two values 30 % apart that hold the answer (×0.25).
        </li>
      </ol>
      <h3>Play</h3>
      <p>
        On each rung you make a guess and learn whether the answer is <b>higher</b> or <b>lower</b>{' '}
        and how far off you are (within 10 %, 25 %, 50 %, ×3, or more). Then <b>keep</b> it and
        score, or <b>climb</b> to the next rung and guess again. On the last rung the guess is kept
        anyway; an exact guess (±2 %) is kept at once too.
      </p>
      <h3>Scoring</h3>
      <p>
        Accuracy: 100 within 2 %, otherwise 100 · e^(−1.5 · |ln(guess / answer)|): ×1.1 gives 87,
        ×1.5 gives 54, ×2 gives 35. Points = accuracy × the rung's value. At most 100 per question.
      </p>
      <h3>Data</h3>
      <p>
        The same as Rough Guess: World Bank commodity prices (1960–2025), distances between 525
        cities, properties of the elements and world facts from Wikidata.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five questions, the same for everyone (500 max). <b>Endless</b>: pick a
        difficulty and topic.
      </p>
      <h3>Controls</h3>
      <p>
        Set the guess with the slider, the − and + buttons (×1.5) or by typing a number. Keyboard:{' '}
        <kbd>←</kbd>/<kbd>→</kbd> ×1.05 (<kbd>Shift</kbd> ×1.5), <kbd>Enter</kbd> guesses; then{' '}
        <kbd>K</kbd> keeps and <kbd>C</kbd> climbs.
      </p>
    </>
  );
}
