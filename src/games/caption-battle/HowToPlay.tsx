import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Cómo se juega</h3>
        <ol>
          <li>
            Cada ronda aparece una ilustración. Todos escriben una frase (75 s); «arriba / abajo»
            pone texto en los dos extremos.
          </li>
          <li>Después, cada uno puntúa los demás memes de 1 a 5 estrellas (el suyo no).</li>
          <li>
            Cada meme suma las estrellas recibidas; el mejor de la ronda gana 3 estrellas extra.
          </li>
          <li>Tras la última ronda gana quien tenga más estrellas.</li>
        </ol>
        <p>
          Los bots escriben frases de su propio banco y puntúan según su gusto declarado: prefieren
          frases de cierta longitud y de tipo «yo cuando…», castigan las de una sola palabra y cada
          uno es más o menos generoso. No pueden juzgar el humor de verdad.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>How to play</h3>
      <ol>
        <li>
          Each round shows an illustration. Everyone writes a caption (75 s); “top / bottom” puts
          text at both ends.
        </li>
        <li>Then everyone rates every other meme from 1 to 5 stars (not their own).</li>
        <li>Each meme scores the stars it gets; the round’s best earns 3 bonus stars.</li>
        <li>After the last round, the most stars wins.</li>
      </ol>
      <p>
        Bots write lines from their own banks and rate by a declared taste: they prefer captions of
        a certain length and “me when…” phrasing, penalise one-word captions, and each is more or
        less generous. They cannot truly judge humour.
      </p>
    </>
  );
}
