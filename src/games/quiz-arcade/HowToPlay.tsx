import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Acertar todas las respuestas de un test antes de que se acabe el tiempo.</p>
        <h3>Formatos</h3>
        <ul>
          <li>
            <strong>Escribir</strong>: escribe cualquier respuesta, en cualquier orden. Se acepta en
            cuanto coincide y la casilla se borra sola; no hace falta pulsar Intro. En las tablas
            con pistas, una respuesta repetida rellena todas sus casillas.
          </li>
          <li>
            <strong>Diapositivas</strong>: nombra lo que aparece (número romano, polígono…).
            «Saltar» lo deja para el final.
          </li>
          <li>
            <strong>Clic</strong>: aparece una pista; haz clic en la casilla correcta. Los fallos se
            cuentan.
          </li>
          <li>
            <strong>Elegir todos</strong>: haz clic en todas las casillas correctas; con tres fallos
            el test termina.
          </li>
        </ul>
        <p>
          Se ignoran mayúsculas, tildes, artículos y plurales. Puedes responder en inglés o en
          español. «Rendirse» muestra lo que faltó. Se guarda tu mejor porcentaje por test.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Get every answer of a quiz before the clock runs out.</p>
      <h3>Formats</h3>
      <ul>
        <li>
          <strong>Type-in</strong>: type any answer in any order. It is accepted the moment it
          matches and the box clears itself — no Enter needed. In hint tables a repeated answer
          fills all its blanks.
        </li>
        <li>
          <strong>Slideshow</strong>: name what is shown (a Roman numeral, a polygon…). “Skip” saves
          it for later.
        </li>
        <li>
          <strong>Clickable</strong>: a clue appears; click the matching tile. Wrong clicks are
          counted.
        </li>
        <li>
          <strong>Pick all</strong>: click every correct tile; three wrong clicks end the quiz.
        </li>
      </ul>
      <p>
        Case, accents, articles and plurals are ignored. Answer in English or Spanish. “Give up”
        reveals what you missed. Your best percentage per quiz is saved.
      </p>
    </>
  );
}
