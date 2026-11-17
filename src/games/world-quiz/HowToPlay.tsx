import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Completar cada test de geografía antes de que se acabe el tiempo.</p>
        <h3>Formatos</h3>
        <ul>
          <li>
            <strong>Mapa: escribir</strong>: escribe nombres de países en cualquier orden; cada
            acierto se pinta en el mapa y la casilla se vacía sola. Valen nombres comunes y
            alternativos («EE. UU.», «Holanda», «Birmania»…), en inglés o español.
          </li>
          <li>
            <strong>Mapa: clic</strong>: se nombra un país; haz clic en él. Los países pequeños
            tienen un punto. Los fallos se cuentan.
          </li>
          <li>
            <strong>Capitales</strong>: tabla de países; escribe sus capitales.
          </li>
          <li>
            <strong>Banderas</strong>: nombra el país de cada bandera; «Saltar» la deja para el
            final.
          </li>
          <li>
            <strong>Clasificaciones</strong>: los países más poblados o más grandes, con su puesto y
            cifra como pista.
          </li>
        </ul>
        <p>
          «Rendirse» o el fin del tiempo muestran en rojo lo que faltó. Se guarda tu mejor
          porcentaje en cada test.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Complete each geography quiz before time runs out.</p>
      <h3>Formats</h3>
      <ul>
        <li>
          <strong>Map type-in</strong>: type country names in any order; each hit is painted on the
          map and the box clears itself. Common and alternative names count (“USA”, “Holland”,
          “Burma”…), in English or Spanish.
        </li>
        <li>
          <strong>Map click</strong>: a country is named; click it. Small countries have a dot.
          Wrong clicks are counted.
        </li>
        <li>
          <strong>Capitals</strong>: a table of countries; type their capitals.
        </li>
        <li>
          <strong>Flags</strong>: name the country of each flag; “Skip” saves it for later.
        </li>
        <li>
          <strong>Rankings</strong>: the most populous or largest countries, with rank and figure as
          clues.
        </li>
      </ul>
      <p>
        “Give up” or the end of the clock shows what you missed in red. Your best percentage per
        quiz is saved.
      </p>
    </>
  );
}
