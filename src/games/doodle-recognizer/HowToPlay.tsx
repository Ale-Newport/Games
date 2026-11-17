import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Que el ordenador reconozca tus dibujos: seis palabras, veinte segundos cada una.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Te mostramos una palabra. Pulsa «¡Entendido!» y dibújala con el ratón, el lápiz o el
            dedo.
          </li>
          <li>
            Mientras dibujas, una red neuronal entrenada con dibujos reales dice lo que ve. En
            cuanto su mejor apuesta es tu palabra, ¡lo ha reconocido!
          </li>
          <li>
            Si se acaba el tiempo (o saltas), pasa a la siguiente. Al final verás tus seis dibujos y
            qué pensó de cada uno.
          </li>
          <li>
            Hay 59 palabras posibles. Puedes activar la voz para que diga sus apuestas en voz alta.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Get the computer to recognize your drawings: six words, twenty seconds each.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          You are shown a word. Press “Got it!” and draw it with the mouse, a pen or your finger.
        </li>
        <li>
          As you draw, a neural network trained on real doodles says what it sees. As soon as its
          top guess is your word, it has recognized it!
        </li>
        <li>
          When time runs out (or you skip) it moves on. At the end you see your six drawings and
          what it thought of each.
        </li>
        <li>There are 59 possible words. Turn on the voice to hear its guesses out loud.</li>
      </ul>
    </>
  );
}
