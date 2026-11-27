import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Responder a preguntas sobre cantidades reales con un <b>rango</b>: «más o menos entre X e
          Y». Si la respuesta cae dentro, cuanto más estrecho sea el rango, más puntos; si cae
          fuera, ninguno. El arte está en saber cuánto sabes.
        </p>
        <h3>Preguntas</h3>
        <ul>
          <li>
            <b>Precios</b>: precio medio anual de 30 materias primas (petróleo, oro, café, trigo,
            cobre…) entre 1960 y 2025, en dólares de cada año (Banco Mundial, Pink Sheet).
          </li>
          <li>
            <b>Distancias</b>: en línea recta entre dos de 525 grandes ciudades, calculadas con sus
            coordenadas.
          </li>
          <li>
            <b>Ciencia</b>: punto de fusión y de ebullición, densidad y masa atómica de los
            elementos químicos; diámetros de planetas y lunas.
          </li>
          <li>
            <b>Datos del mundo</b>: población, PIB, superficies, ríos, montañas, edificios.
          </li>
        </ul>
        <h3>Puntuación</h3>
        <p>
          Acierto: 100 × (1 − anchura / 2), mínimo 10, donde la anchura son los órdenes de magnitud
          entre los dos límites: un rango ×2 (de 100 a 200) vale 85; ×10 vale 50; ×100 o más, 10.
          Fallo: 0. Al final ves tu calibración: qué parte de tus rangos contenía la respuesta.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: diez preguntas, las mismas para todos (máximo 1000). <b>Sin fin</b>:
          dificultad y tema a elegir.
        </p>
        <h3>Controles</h3>
        <p>
          Arrastra los tiradores, o la banda para moverla entera. Teclado: <kbd>Tab</kbd> hasta un
          tirador, <kbd>←</kbd>/<kbd>→</kbd> lo mueven (<kbd>Mayús</kbd> ×5), <kbd>Inicio</kbd>/
          <kbd>Fin</kbd> al extremo.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Answer questions about real quantities with a <b>range</b>: “roughly between X and Y”. If
        the answer falls inside, the narrower the range, the more points; if it falls outside, none.
        The art is knowing how much you know.
      </p>
      <h3>Questions</h3>
      <ul>
        <li>
          <b>Prices</b>: annual average price of 30 commodities (oil, gold, coffee, wheat, copper…)
          from 1960 to 2025, in each year's dollars (World Bank Pink Sheet).
        </li>
        <li>
          <b>Distances</b>: straight-line distance between two of 525 major cities, computed from
          their coordinates.
        </li>
        <li>
          <b>Science</b>: melting and boiling points, density and atomic mass of the chemical
          elements; diameters of planets and moons.
        </li>
        <li>
          <b>World facts</b>: populations, GDP, areas, rivers, mountains, buildings.
        </li>
      </ul>
      <h3>Scoring</h3>
      <p>
        Hit: 100 × (1 − width / 2), at least 10, where width is the number of orders of magnitude
        between the bounds: a ×2 range (100 to 200) is worth 85; ×10 is 50; ×100 or more, 10. Miss:
        0. At the end you see your calibration: the share of your ranges that held the answer.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: ten questions, the same for everyone (1000 max). <b>Endless</b>: pick a
        difficulty and topic.
      </p>
      <h3>Controls</h3>
      <p>
        Drag the handles, or the band to move it whole. Keyboard: <kbd>Tab</kbd> to a handle,{' '}
        <kbd>←</kbd>/<kbd>→</kbd> move it (<kbd>Shift</kbd> ×5), <kbd>Home</kbd>/<kbd>End</kbd> to
        the end.
      </p>
    </>
  );
}
