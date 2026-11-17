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
            Cada intento muestra su <strong>similitud</strong> con la secreta (de −100 a 100):
            cuanto más alta, más parecido el significado.
          </li>
          <li>
            Si el intento está entre las 1000 palabras más cercanas, verás «N/1000» (1000 es la más
            cercana). Si no, aparece «fría» o «tibia».
          </li>
          <li>
            La cabecera da la similitud de la palabra más cercana, la décima y la milésima, para que
            sepas qué es «caliente» hoy.
          </li>
          <li>
            Los plurales cuentan como su singular; las palabras desconocidas y repetidas no gastan
            intento.
          </li>
          <li>«Rendirse» muestra la palabra y sus más cercanas.</li>
        </ul>
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
          Each guess shows its <strong>similarity</strong> to the secret (−100 to 100): the higher,
          the closer the meaning.
        </li>
        <li>
          If the guess is among the 1,000 nearest words you see “N/1000” (1000 is the nearest).
          Otherwise it is “cold” or “tepid”.
        </li>
        <li>
          The header gives the similarity of the nearest, tenth-nearest and thousandth-nearest
          words, so you know what “hot” means today.
        </li>
        <li>Plurals count as their singular; unknown and repeated words do not use a guess.</li>
        <li>“Give up” shows the word and its nearest words.</li>
      </ul>
    </>
  );
}
