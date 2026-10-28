import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Adivina la palabra oculta de cinco letras en seis intentos.</p>
        <h3>Marcas</h3>
        <ul>
          <li>
            Verde azulado con <strong>●</strong>: la letra está en su sitio.
          </li>
          <li>
            Ámbar con <strong>○</strong>: la letra está en la palabra, en otro sitio.
          </li>
          <li>Gris: la letra no está (o no tantas veces como la escribiste).</li>
        </ul>
        <p>
          Cada intento debe ser una palabra aceptada. En español las tildes no cuentan (la Ñ es su
          propia letra). Puedes jugar con palabras en inglés o en español, sea cual sea el idioma de
          la página.
        </p>
        <h3>Modo difícil</h3>
        <p>
          Las letras en su sitio deben quedarse ahí y las letras encontradas deben usarse en los
          intentos siguientes.
        </p>
        <h3>Ayudas</h3>
        <p>
          La pista dice cuántas palabras encajan con todo lo visto y propone la que deja menos
          posibilidades de media (las pistas se cuentan). La palabra del día es la misma para todos.
        </p>
        <h3>Controles</h3>
        <p>
          Teclado en pantalla o físico: letras · <kbd>Retroceso</kbd> borrar · <kbd>Intro</kbd>{' '}
          enviar.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Guess the hidden five-letter word in six tries.</p>
      <h3>Marks</h3>
      <ul>
        <li>
          Teal with <strong>●</strong>: the letter is in the right place.
        </li>
        <li>
          Amber with <strong>○</strong>: the letter is in the word, somewhere else.
        </li>
        <li>Gray: the letter is not in the word (or not as many times as you typed it).</li>
      </ul>
      <p>
        Every guess must be an accepted word. Spanish words ignore accents (Ñ is its own letter).
        You can play English or Spanish words whatever the page language.
      </p>
      <h3>Hard mode</h3>
      <p>
        Letters in the right place must stay there and letters found must be used in later guesses.
      </p>
      <h3>Help</h3>
      <p>
        A hint says how many words fit everything seen so far and suggests the one that leaves the
        fewest possibilities on average (hints are counted). Today’s word is the same for everyone.
      </p>
      <h3>Controls</h3>
      <p>
        On-screen or physical keyboard: letters · <kbd>Backspace</kbd> delete · <kbd>Enter</kbd>{' '}
        guess.
      </p>
    </>
  );
}
