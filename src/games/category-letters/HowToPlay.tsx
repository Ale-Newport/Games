import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Sumar más puntos que el resto escribiendo respuestas originales que empiecen por la letra
          de la ronda.
        </p>
        <h3>Ronda</h3>
        <ul>
          <li>
            Se tira el dado de letras (sin K, Ñ, Q, U, W, X, Y, Z salvo con «todo el alfabeto»).
          </li>
          <li>
            Rellena las categorías de la lista antes de que acabe el tiempo. Puedes terminar antes
            con «He terminado».
          </li>
          <li>
            Con varias personas en el dispositivo, cada una rellena su lista por turnos con el mismo
            tiempo.
          </li>
        </ul>
        <h3>Puntuación</h3>
        <ul>
          <li>
            1 punto por cada respuesta válida que <strong>nadie más</strong> haya escrito en esa
            categoría.
          </li>
          <li>
            Las repetidas (aunque cambien mayúsculas, tildes, artículos o plurales) valen 0 para
            todos.
          </li>
          <li>
            Las respuestas que el juego conoce son válidas al instante. Las desconocidas se someten
            a votación: los bots aceptan las que parecen palabras reales; si hay más personas en la
            mesa, ellas deciden.
          </li>
          <li>Los artículos iniciales («el», «la», «un»…) no cuentan para la letra.</li>
          <li>
            Aliteración (opcional): +1 por cada palabra extra que empiece por la letra («Pato
            Pekinés» = 2).
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Escribe en cada línea; <kbd>Intro</kbd> o <kbd>Tab</kbd> bajan a la siguiente.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Outscore the table by writing original answers that start with the round’s letter.</p>
      <h3>A round</h3>
      <ul>
        <li>The letter die is rolled (no Q, U, V, X, Y, Z unless “whole alphabet” is on).</li>
        <li>Fill the list’s categories before the timer runs out. “I’m done” hands in early.</li>
        <li>
          With several people on the device, each fills their list in turn with the same time.
        </li>
      </ul>
      <h3>Scoring</h3>
      <ul>
        <li>
          1 point for every valid answer <strong>nobody else</strong> wrote in that category.
        </li>
        <li>
          Repeated answers (ignoring case, accents, articles and plurals) score 0 for everyone.
        </li>
        <li>
          Answers the game knows are valid at once. Unknown ones go to a vote: bots accept answers
          that look like real words; other people at the table decide for themselves.
        </li>
        <li>Leading articles (“the”, “a”, “an”) do not count toward the letter.</li>
        <li>
          Alliteration (optional): +1 for each further word starting with the letter (“Purple
          Penguin” = 2).
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Type on each line; <kbd>Enter</kbd> or <kbd>Tab</kbd> moves down.
      </p>
    </>
  );
}
