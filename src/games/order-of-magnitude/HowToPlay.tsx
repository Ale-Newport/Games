import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Estimar cantidades reales —población de ciudades y países, PIB, turistas, longitud de
          ríos, altitud de montañas, superficie de lagos, islas y países, altura de edificios,
          longitud de puentes y barcos, diámetro de planetas y estrellas— acertando sobre todo el
          orden de magnitud.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Responde en notación científica: una cifra inicial (1,0–9,9) por una potencia de diez
            (10⁰–10¹⁵). También puedes escribir el número.
          </li>
          <li>
            Tienes tres intentos. Tras cada uno sabes si la respuesta es mayor o menor y cuánto te
            alejas: muy cerca (menos de ×1,26), cerca (menos de ×2), orden correcto (menos de ×10) o
            a N órdenes de magnitud. La regla muestra dónde puede estar todavía.
          </li>
          <li>
            Puedes fijar tu último intento cuando quieras; el tercero se fija solo, y también uno a
            menos del 5 % de la respuesta.
          </li>
          <li>
            Puntos = precisión × factor del intento (1, 0,85, 0,7). Precisión: 100 a menos del 5 %;
            si no, 100 × (1 − órdenes de error / 2): el doble da 85, diez veces da 50, cien veces da
            0.
          </li>
        </ul>
        <h3>Modos</h3>
        <ul>
          <li>
            <b>Diario</b>: cinco preguntas conocidas de tipos distintos, las mismas para todos ese
            día (máximo 500).
          </li>
          <li>
            <b>Sin fin</b>: dificultad (fácil: lo más conocido; normal; difícil: todo) y tema
            (población, economía y viajes, geografía, edificios y barcos, espacio).
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Botones − y + o el deslizador. Teclado: <kbd>↑</kbd>/<kbd>↓</kbd> potencia de diez,{' '}
          <kbd>←</kbd>/<kbd>→</kbd> cifra inicial (<kbd>Mayús</kbd>: de uno en uno),{' '}
          <kbd>Intro</kbd> prueba, <kbd>L</kbd> fija.
        </p>
        <h3>Datos</h3>
        <p>
          5.101 cantidades verificadas: Wikidata (CC0) —solo cifras coherentes y plausibles; en
          poblaciones de ciudades, la más reciente con fecha desde 1990— y el Banco Mundial (CC BY
          4.0), último dato de cada país. Cada respuesta enlaza a su fuente y muestra el año cuando
          importa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Estimate real quantities — populations of cities and countries, GDP, tourists, river
        lengths, mountain heights, areas of lakes, islands and countries, building heights, bridge
        and ship lengths, diameters of planets and stars — getting the order of magnitude right
        above all.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          Answer in scientific notation: a leading figure (1.0–9.9) times a power of ten (10⁰–10¹⁵).
          You can also type the number.
        </li>
        <li>
          You have three guesses. After each one you learn whether the answer is higher or lower and
          how far off you are: very close (within ×1.26), close (within ×2), right order of
          magnitude (within ×10) or N orders off. The ruler shows where it can still be.
        </li>
        <li>
          Lock your last guess in whenever you like; the third locks itself, and so does any guess
          within 5 % of the answer.
        </li>
        <li>
          Points = accuracy × the guess factor (1, 0.85, 0.7). Accuracy: 100 within 5 %; otherwise
          100 × (1 − orders off / 2): double scores 85, ten times 50, a hundred times 0.
        </li>
      </ul>
      <h3>Modes</h3>
      <ul>
        <li>
          <b>Daily</b>: five well-known questions of different kinds, the same for everyone that day
          (500 max).
        </li>
        <li>
          <b>Endless</b>: difficulty (easy: the best known; normal; hard: everything) and topic
          (populations, economy & travel, geography, buildings & ships, space).
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        The − and + buttons or the slider. Keyboard: <kbd>↑</kbd>/<kbd>↓</kbd> power of ten,{' '}
        <kbd>←</kbd>/<kbd>→</kbd> leading figure (<kbd>Shift</kbd>: whole steps), <kbd>Enter</kbd>{' '}
        guesses, <kbd>L</kbd> locks in.
      </p>
      <h3>Data</h3>
      <p>
        5,101 verified quantities: Wikidata (CC0) — only consistent, plausible figures; for city
        populations the latest dated figure from 1990 on — and the World Bank (CC BY 4.0), each
        country's latest value. Every answer links to its source and shows the year when it matters.
      </p>
    </>
  );
}
