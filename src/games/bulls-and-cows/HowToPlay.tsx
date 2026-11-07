import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Descubre un número secreto de 3, 4 o 5 cifras, todas distintas (puede empezar por 0).</p>
        <h3>Respuestas</h3>
        <ul>
          <li>
            <strong>Toro (T)</strong>: una cifra correcta en su sitio.
          </li>
          <li>
            <strong>Vaca (V)</strong>: una cifra que está en el número, pero en otro sitio.
          </li>
          <li>Tus intentos también deben tener cifras distintas. Tienes 15 intentos.</li>
        </ul>
        <h3>Duelo</h3>
        <p>
          Eliges tu propio número y el ordenador elige el suyo. Por turnos, cada uno intenta
          descifrar el del otro; empiezas tú. Si lo descifras, el ordenador tiene un último intento
          para empatar. El rival fácil solo recuerda sus tres últimas respuestas; el medio siempre
          prueba un número coherente; el difícil elige el intento que deja menos números de media.
        </p>
        <h3>Ayudas</h3>
        <p>
          Marca las cifras en las notas (descartada, está, sin nota); las marcas se ven también en
          el teclado. Si un intento contradice una respuesta anterior, se avisa. Fuera del duelo, la
          pista dice cuántos números siguen encajando y propone un intento.
        </p>
        <h3>Controles</h3>
        <p>
          Teclado en pantalla o físico: cifras · <kbd>Retroceso</kbd> borrar · <kbd>Intro</kbd>{' '}
          comprobar · <kbd>H</kbd> pista · <kbd>N</kbd> nueva.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Find a secret number of 3, 4 or 5 different digits (it may start with 0).</p>
      <h3>Scores</h3>
      <ul>
        <li>
          <strong>Bull (B)</strong>: a right digit in the right place.
        </li>
        <li>
          <strong>Cow (C)</strong>: a digit that is in the number, but somewhere else.
        </li>
        <li>Your guesses use different digits too. You have 15 guesses.</li>
      </ul>
      <h3>Duel</h3>
      <p>
        You choose your own number and the computer chooses its own. In turns, each tries to crack
        the other’s; you go first. If you crack it, the computer gets one last guess to draw. The
        easy opponent remembers only its last three scores; medium always guesses a consistent
        number; hard picks the guess that leaves the fewest numbers on average.
      </p>
      <h3>Help</h3>
      <p>
        Mark digits in the notes (ruled out, in, no note); the marks also show on the keypad. A
        guess that contradicts an earlier score is flagged. Outside the duel, a hint says how many
        numbers still fit and suggests a guess.
      </p>
      <h3>Controls</h3>
      <p>
        On-screen or physical keyboard: digits · <kbd>Backspace</kbd> delete · <kbd>Enter</kbd>{' '}
        check · <kbd>H</kbd> hint · <kbd>N</kbd> new.
      </p>
    </>
  );
}
