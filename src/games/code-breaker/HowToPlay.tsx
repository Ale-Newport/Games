import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          El ordenador esconde un código de clavijas de colores. Descúbrelo antes de agotar los
          intentos.
        </p>
        <h3>Respuestas</h3>
        <ul>
          <li>
            <strong>●</strong> (llena): un color correcto en su sitio.
          </li>
          <li>
            <strong>○</strong> (hueca): un color que está en el código, pero en otro sitio.
          </li>
          <li>
            Las respuestas no dicen qué clavija es cuál. Cada clavija del código se cuenta una sola
            vez: si pruebas dos rojas y el código tiene una, solo cuenta una.
          </li>
        </ul>
        <h3>Códigos</h3>
        <ul>
          <li>Fácil: 4 clavijas, 6 colores, ninguno repetido; 10 intentos.</li>
          <li>Clásico: 4 clavijas, 6 colores que pueden repetirse; 10 intentos.</li>
          <li>Difícil: 5 clavijas, 8 colores que pueden repetirse; 12 intentos.</li>
        </ul>
        <h3>Ayudas</h3>
        <p>
          Si un intento contradice una respuesta anterior, se avisa. La pista dice cuántos códigos
          siguen encajando y propone el intento del descifrador minimax: el que, en el peor caso,
          deja menos códigos. En «Pon un código a la IA» eliges tú el código y la IA lo descifra
          explicando cuántos quedan.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una clavija del intento y luego un color (salta sola a la siguiente); toca la clavija
          elegida para vaciarla. <kbd>1</kbd>–<kbd>8</kbd> colores · <kbd>←</kbd>/<kbd>→</kbd>{' '}
          clavija · <kbd>Retroceso</kbd> borrar · <kbd>Intro</kbd> comprobar · <kbd>H</kbd> pista ·{' '}
          <kbd>N</kbd> nueva.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>The computer hides a code of colored pegs. Work it out before you run out of guesses.</p>
      <h3>Scores</h3>
      <ul>
        <li>
          <strong>●</strong> (solid): a right color in the right place.
        </li>
        <li>
          <strong>○</strong> (hollow): a color that is in the code, but somewhere else.
        </li>
        <li>
          The score never says which peg is which. Each peg of the code counts once: guess two reds
          when the code has one, and only one counts.
        </li>
      </ul>
      <h3>Codes</h3>
      <ul>
        <li>Easy: 4 pegs, 6 colors, none repeated; 10 guesses.</li>
        <li>Classic: 4 pegs, 6 colors that may repeat; 10 guesses.</li>
        <li>Hard: 5 pegs, 8 colors that may repeat; 12 guesses.</li>
      </ul>
      <h3>Help</h3>
      <p>
        A guess that contradicts an earlier score is flagged. A hint says how many codes still fit
        and suggests the minimax breaker’s guess: the one whose worst answer leaves the fewest
        codes. In “Set a code for the AI” you choose the code and the AI cracks it, saying how many
        codes are left.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a peg of your guess, then a color (it moves on by itself); tap the selected peg to empty
        it. <kbd>1</kbd>–<kbd>8</kbd> colors · <kbd>←</kbd>/<kbd>→</kbd> peg · <kbd>Backspace</kbd>{' '}
        clear · <kbd>Enter</kbd> check · <kbd>H</kbd> hint · <kbd>N</kbd> new.
      </p>
    </>
  );
}
