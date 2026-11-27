import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Un concurso de estimaciones a ocho rondas para 2–4 concursantes (personas que se turnan en
          el dispositivo y/o el ordenador). Quien sume más puntos gana.
        </p>
        <h3>Cada ronda</h3>
        <ul>
          <li>
            Una pregunta sobre una cantidad real: precios de materias primas, distancias entre
            ciudades, propiedades de los elementos, poblaciones, superficies, ríos, montañas…
          </li>
          <li>
            Se responde por turnos (quién empieza rota cada ronda) y cada uno ve las respuestas ya
            dadas: puedes ponerte justo al lado de un rival para quedarte con su lado.
          </li>
          <li>
            Puntos según la diana, por la proporción con la respuesta real: ×1,02 → 10, ×1,05 → 8,
            ×1,1 → 6, ×1,25 → 4, ×1,5 → 3, ×2 → 2, ×10 → 1, más lejos → 0. La respuesta más cercana
            gana +3 (los empates se lo llevan todos).
          </li>
          <li>Las rondas 1–2 son fáciles, 3–5 normales, 6–8 difíciles; la 8.ª vale el doble.</li>
        </ul>
        <h3>El ordenador</h3>
        <p>
          Nunca ve la respuesta. Fácil responde al azar en torno a lo típico de ese tipo de
          pregunta. Normal conoce lo típico y elige la respuesta con más puntos esperados frente a
          las ya dadas. Difícil además razona como un experto con datos relacionados (años vecinos
          de un precio, elementos vecinos en la tabla periódica).
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: tú contra tres concursantes normales, con las mismas preguntas para todos.
          <b> Personalizada</b>: elige concursantes, nombres y niveles.
        </p>
        <h3>Controles</h3>
        <p>
          Deslizador, botones − y + (÷/×1,5), o escribe el número. Teclado: <kbd>←</kbd>/
          <kbd>→</kbd> ×1,05 (<kbd>Mayús</kbd> ×1,5), <kbd>Intro</kbd> fija.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        An eight-round estimation contest for 2–4 contestants (people taking turns on the device
        and/or computer players). The highest total wins.
      </p>
      <h3>Each round</h3>
      <ul>
        <li>
          A question about a real quantity: commodity prices, distances between cities, properties
          of the elements, populations, areas, rivers, mountains…
        </li>
        <li>
          Contestants answer in turn (who goes first rotates every round) and see the answers
          already given: you may sit right beside a rival to take their side.
        </li>
        <li>
          Target points by the ratio to the real answer: ×1.02 → 10, ×1.05 → 8, ×1.1 → 6, ×1.25 → 4,
          ×1.5 → 3, ×2 → 2, ×10 → 1, further → 0. The closest answer earns +3 (ties all get it).
        </li>
        <li>Rounds 1–2 are easy, 3–5 normal, 6–8 hard; round 8 counts double.</li>
      </ul>
      <h3>The computer</h3>
      <p>
        It never sees the answer. Easy answers at random around what is typical for that kind of
        question. Normal knows what is typical and picks the answer with the best expected points
        against the answers already given. Hard also reasons like an expert from related facts
        (neighbouring years of a price, neighbouring elements in the periodic table).
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: you against three Normal contestants, the same questions for everyone.{' '}
        <b>Custom</b>: choose the contestants, names and levels.
      </p>
      <h3>Controls</h3>
      <p>
        Slider, − and + buttons (÷/×1.5), or type the number. Keyboard: <kbd>←</kbd>/<kbd>→</kbd>{' '}
        ×1.05 (<kbd>Shift</kbd> ×1.5), <kbd>Enter</kbd> locks in.
      </p>
    </>
  );
}
