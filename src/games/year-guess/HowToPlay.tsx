import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada ronda muestra un suceso real con fecha —una batalla, un tratado, un descubrimiento,
          una película, un cuadro, una inauguración…— y una pregunta: <b>¿en qué año?</b>
        </p>
        <h3>La línea del tiempo</h3>
        <p>
          Va del 3000 a. C. al 2025 y está comprimida con la antigüedad: cerca de hoy cada año ocupa
          mucho sitio; en la Antigüedad, un siglo ocupa poco. Arrastra o toca para elegir un año,
          ajústalo con los botones (±1, ±10, ±100) o escríbelo («1815», «44 a. C.»).
        </p>
        <h3>Puntuación</h3>
        <p>
          100 × 2^(−error / m), donde m (el error que vale la mitad de puntos) es el 4 % de la
          antigüedad del suceso, como mínimo 2 años. Una película del 2000: a 1 año, 71; a 5, 18.
          Una batalla de 1066: a 20 años, 70. Una del 490 a. C.: a 100 años, 50. El año exacto vale
          100. No existe el año 0: del 1 a. C. se pasa al 1.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco sucesos, uno de cada época (Antigüedad o Edad Media, 1500–1799, siglo
          XIX, 1900–1959, desde 1960) en orden aleatorio, los mismos para todos; al final, tu línea
          del tiempo. <b>Sin fin</b>: dificultad, época y tema a elegir.
        </p>
        <h3>Datos</h3>
        <p>
          Wikidata (CC0): fechas con precisión de año o mejor; los estrenos y publicaciones usan la
          primera fecha; los sucesos con fechas contradictorias se descartan, y también las
          descripciones que delatan el año o el siglo.
        </p>
        <h3>Controles</h3>
        <p>
          Con la línea enfocada: <kbd>←</kbd>/<kbd>→</kbd> un año (<kbd>Mayús</kbd> diez),{' '}
          <kbd>Re Pág</kbd>/<kbd>Av Pág</kbd> cien, <kbd>Inicio</kbd>/<kbd>Fin</kbd> a los extremos,{' '}
          <kbd>Intro</kbd> fija.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each round shows a real dated event — a battle, a treaty, a discovery, a film, a painting,
        an opening… — and one question: <b>what year?</b>
      </p>
      <h3>The timeline</h3>
      <p>
        It runs from 3000 BC to 2025 and is compressed with age: near today every year is wide; in
        antiquity a century is narrow. Drag or tap to pick a year, nudge it with the buttons (±1,
        ±10, ±100) or type it (“1815”, “44 BC”).
      </p>
      <h3>Scoring</h3>
      <p>
        100 × 2^(−error / h), where h (the error worth half points) is 4 % of the event's age, at
        least 2 years. A 2000 film: 1 year off, 71; 5 off, 18. A 1066 battle: 20 off, 70. A 490 BC
        battle: 100 off, 50. The exact year is worth 100. There is no year 0: 1 BC is followed by AD
        1.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five events, one from each era (antiquity or Middle Ages, 1500–1799, 19th
        century, 1900–1959, since 1960) in a random order, the same for everyone; at the end, your
        timeline. <b>Endless</b>: pick a difficulty, era and topic.
      </p>
      <h3>Data</h3>
      <p>
        Wikidata (CC0): dates precise to the year or better; releases and publications use the first
        date; events with conflicting dates are dropped, and so are descriptions that give away the
        year or century.
      </p>
      <h3>Controls</h3>
      <p>
        With the timeline focused: <kbd>←</kbd>/<kbd>→</kbd> one year (<kbd>Shift</kbd> ten),{' '}
        <kbd>Page Up</kbd>/<kbd>Page Down</kbd> a hundred, <kbd>Home</kbd>/<kbd>End</kbd> the ends,{' '}
        <kbd>Enter</kbd> locks in.
      </p>
    </>
  );
}
