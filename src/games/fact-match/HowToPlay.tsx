import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada tablero tiene <b>cinco datos</b> de una misma familia y <b>siete números</b>. Cinco
          son las respuestas; los otros dos son <b>señuelos</b>: valores reales de otros miembros de
          la familia que no están en el tablero. Empareja cada dato con su número.
        </p>
        <h3>Familias</h3>
        <ul>
          <li>El precio de una materia prima en cinco años (Banco Mundial).</li>
          <li>Distancias en línea recta desde una ciudad a cinco ciudades de otros países.</li>
          <li>Una propiedad (fusión, ebullición, densidad, masa) de cinco elementos.</li>
          <li>Un dato del mundo para cinco lugares: población, PIB, superficie, altura…</li>
        </ul>
        <h3>Cómo se juega</h3>
        <p>
          Elige un número y luego un dato (o al revés); toca un dato ocupado para devolver su
          número. Después <b>comprueba</b>: los aciertos quedan fijados en verde y los fallos
          vuelven a la bandeja con una cruz que recuerda esa pareja. Tres comprobaciones por
          tablero.
        </p>
        <h3>Puntuación</h3>
        <p>
          Cada dato fijado vale 20 puntos en la primera comprobación, 12 en la segunda y 6 en la
          tercera: máximo 100 por tablero.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: tres tableros —un precio, uno de ciencia o distancias y uno del mundo—, los
          mismos para todos (máximo 300). <b>Sin fin</b>: dificultad y tema a elegir.
        </p>
        <h3>Controles</h3>
        <p>
          Teclado: <kbd>1</kbd>–<kbd>7</kbd> eligen número, <kbd>A</kbd>–<kbd>E</kbd> lo colocan en
          un dato, <kbd>Intro</kbd> comprueba, <kbd>Esc</kbd> anula la selección.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each board has <b>five facts</b> from one family and <b>seven numbers</b>. Five are the
        answers; the other two are <b>decoys</b>: true values of other members of the family that
        are not on the board. Match each fact with its number.
      </p>
      <h3>Families</h3>
      <ul>
        <li>One commodity’s price in five years (World Bank).</li>
        <li>Straight-line distances from one city to five cities in other countries.</li>
        <li>One property (melting, boiling, density, mass) of five elements.</li>
        <li>One world fact for five places: population, GDP, area, height…</li>
      </ul>
      <h3>Play</h3>
      <p>
        Pick a number, then a fact (or the other way round); tap a filled fact to send its number
        back. Then <b>check</b>: correct matches lock in green and wrong ones return to the tray
        with a cross that remembers the pairing. Three checks per board.
      </p>
      <h3>Scoring</h3>
      <p>
        Each locked fact is worth 20 points on the first check, 12 on the second and 6 on the third:
        at most 100 per board.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: three boards — a price, a science or distance board, a world board — the same
        for everyone (300 max). <b>Endless</b>: pick a difficulty and topic.
      </p>
      <h3>Controls</h3>
      <p>
        Keyboard: <kbd>1</kbd>–<kbd>7</kbd> pick a number, <kbd>A</kbd>–<kbd>E</kbd> place it on a
        fact, <kbd>Enter</kbd> checks, <kbd>Esc</kbd> clears the selection.
      </p>
    </>
  );
}
