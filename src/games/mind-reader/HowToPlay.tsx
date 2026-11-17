import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Piensa en un animal, un objeto o un personaje (mitología, cuentos o libros clásicos) e
          intenta que el lector de mentes no lo adivine.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Responde a cada pregunta con Sí, No, No lo sé, Probablemente o Probablemente no. «Atrás»
            deshace la última respuesta.
          </li>
          <li>
            Cuando está seguro (o tras 20, 30 y 40 preguntas) apuesta. Si falla, sigue preguntando.
          </li>
          <li>
            Ganas si falla tres veces o llega a 45 preguntas. Entonces dile en qué pensabas: aprende
            de tus respuestas para la próxima vez.
          </li>
        </ul>
        <h3>Teclado</h3>
        <p>
          <kbd>S</kbd>/<kbd>Y</kbd> sí · <kbd>N</kbd> no · <kbd>D</kbd> no lo sé · <kbd>P</kbd>{' '}
          probablemente · <kbd>O</kbd> probablemente no · <kbd>Retroceso</kbd> atrás.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Think of an animal, an object or a character (myth, folk tales or classic books) and try to
        keep the mind reader from guessing it.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          Answer each question Yes, No, Don’t know, Probably or Probably not. Back undoes your last
          answer.
        </li>
        <li>
          When it is confident (or after 20, 30 and 40 questions) it guesses. If wrong, it keeps
          asking.
        </li>
        <li>
          You win if it is wrong three times or reaches 45 questions. Then tell it what you had in
          mind: it learns from your answers for next time.
        </li>
      </ul>
      <h3>Keyboard</h3>
      <p>
        <kbd>Y</kbd> yes · <kbd>N</kbd> no · <kbd>D</kbd> don’t know · <kbd>P</kbd> probably ·{' '}
        <kbd>O</kbd> probably not · <kbd>Backspace</kbd> back.
      </p>
    </>
  );
}
