import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Encontrar el país misterioso con los mínimos intentos.</p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Prueba cualquier país: se colorea en el globo según la distancia entre su frontera y la
            del país misterioso. Casi blanco: lejos; naranja: cerca; rojo intenso: se tocan.
          </li>
          <li>
            No hay límite de intentos. La lista ordena tus intentos del más cercano al más lejano.
          </li>
          <li>
            Arrastra para girar el globo; usa + y − o la rueda para acercarte. Gira solo hacia tu
            último intento.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Find the mystery country in as few guesses as you can.</p>
      <h3>Rules</h3>
      <ul>
        <li>
          Guess any country: it is coloured on the globe by the distance between its border and the
          mystery country’s. Near-white: far; orange: close; deep red: touching.
        </li>
        <li>There is no limit on guesses. The list sorts your guesses from closest to farthest.</li>
        <li>
          Drag to spin the globe; use + and − or the wheel to zoom. It turns to your latest guess by
          itself.
        </li>
      </ul>
    </>
  );
}
