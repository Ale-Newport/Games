import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Encontrar la palabra secreta (en inglés).</p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Escribe cualquier palabra inglesa. Recibe un <strong>puesto</strong>: lo cerca que está
            en significado de la secreta entre 30 000 palabras. La secreta es la n.º 1.
          </li>
          <li>
            Verde: puesto 300 o mejor; amarillo: hasta 1500; rojo: más lejos. La lista se ordena por
            puesto y tu último intento queda arriba.
          </li>
          <li>
            Los plurales cuentan como su singular. Las palabras desconocidas no gastan intento.
          </li>
          <li>
            <strong>Pista</strong>: revela una palabra a mitad de camino entre tu mejor puesto y la
            secreta.
          </li>
          <li>
            <strong>Rendirse</strong> muestra la palabra y las 100 más cercanas.
          </li>
        </ul>
        <p>
          El significado se mide con vectores de palabras (GloVe): palabras usadas en contextos
          parecidos están cerca, así que «cerca» no siempre significa sinónimo.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Find the secret English word.</p>
      <h3>Rules</h3>
      <ul>
        <li>
          Type any English word. It gets a <strong>rank</strong>: how close it is in meaning to the
          secret among 30,000 words. The secret is #1.
        </li>
        <li>
          Green: rank 300 or better; yellow: up to 1,500; red: further. The list is sorted by rank
          and your latest guess stays on top.
        </li>
        <li>Plurals count as their singular. Unknown words do not use a guess.</li>
        <li>
          <strong>Hint</strong>: reveals a word halfway between your best rank and the secret.
        </li>
        <li>
          <strong>Give up</strong> shows the word and its 100 closest words.
        </li>
      </ul>
      <p>
        Meaning is measured with word vectors (GloVe): words used in similar contexts are close, so
        “close” is not always a synonym.
      </p>
    </>
  );
}
