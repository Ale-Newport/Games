import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Adivinar el país (o territorio) a partir de su silueta en seis intentos.</p>
        <h3>Pistas</h3>
        <ul>
          <li>
            Cada fallo muestra la <strong>distancia</strong> entre los centros de los dos países,
            una <strong>flecha</strong> hacia el país misterioso y una <strong>proximidad</strong>{' '}
            (100 % es el país; 0 % está en las antípodas).
          </li>
          <li>
            Escribe y elige de la lista de sugerencias; valen nombres en inglés o español y
            alternativos.
          </li>
          <li>Al terminar, dos preguntas extra: la capital y la bandera, con cuatro opciones.</li>
        </ul>
        <p>
          La silueta se dibuja con una proyección centrada en el país, así su forma es fiel a
          cualquier latitud.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Guess the country (or territory) from its silhouette in six tries.</p>
      <h3>Clues</h3>
      <ul>
        <li>
          Each miss shows the <strong>distance</strong> between the two countries’ centres, an{' '}
          <strong>arrow</strong> towards the mystery country and a <strong>proximity</strong> (100%
          is the country; 0% is the other side of the world).
        </li>
        <li>Type and pick from the suggestions; English, Spanish and alternative names work.</li>
        <li>Afterwards, two bonus questions: the capital and the flag, from four options.</li>
      </ul>
      <p>
        The outline is drawn with a projection centred on the country, so its shape is true at any
        latitude.
      </p>
    </>
  );
}
