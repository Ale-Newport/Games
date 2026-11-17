import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Adivinar el país de la bandera oculta en seis intentos.</p>
        <h3>Reglas</h3>
        <ul>
          <li>
            La bandera está tapada por seis piezas. Cada intento fallido levanta una pieza más.
          </li>
          <li>
            Cada fallo muestra la distancia entre los centros de los dos países, una flecha hacia el
            país buscado y una proximidad (100 % = el país).
          </li>
          <li>Escribe y elige de las sugerencias; valen nombres en inglés y español.</li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Guess the country of the hidden flag in six tries.</p>
      <h3>Rules</h3>
      <ul>
        <li>The flag is covered by six tiles. Each wrong guess lifts one more tile.</li>
        <li>
          Each miss shows the distance between the two countries’ centres, an arrow towards the
          target and a proximity (100% = the country).
        </li>
        <li>Type and pick from the suggestions; English and Spanish names work.</li>
      </ul>
    </>
  );
}
