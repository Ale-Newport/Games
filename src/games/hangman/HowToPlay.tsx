import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Adivina la palabra oculta letra a letra. Cada letra que está se descubre en todos sus
          sitios; cada letra que no está añade un trazo al dibujo. Si el dibujo se completa,
          pierdes.
        </p>
        <h3>Niveles</h3>
        <ul>
          <li>Fácil: 8 fallos permitidos, categoría visible.</li>
          <li>Normal: 6 fallos permitidos, categoría visible.</li>
          <li>Difícil: 5 fallos permitidos, categoría oculta.</li>
        </ul>
        <p>
          Elige palabras en inglés o en español y una categoría (animales, comida, naturaleza, casa,
          oficios, deportes) o cualquiera. En español las tildes no cuentan y la Ñ es su propia
          letra.
        </p>
        <h3>Dos jugadores</h3>
        <p>Un jugador escribe una palabra secreta sin que el otro mire y le pasa el dispositivo.</p>
        <h3>Ayudas</h3>
        <p>
          La pista cuenta cuántas palabras de la lista encajan con lo que ves y propone la letra que
          más de ellas contienen (las pistas se cuentan).
        </p>
        <h3>Controles</h3>
        <p>
          Toca una letra o escríbela con el teclado · <kbd>Mayús</kbd>+<kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Guess the hidden word one letter at a time. A letter in the word is revealed in every place;
        a letter that is not adds a stroke to the drawing. If the drawing is finished, you lose.
      </p>
      <h3>Levels</h3>
      <ul>
        <li>Easy: 8 wrong letters allowed, category shown.</li>
        <li>Normal: 6 wrong letters allowed, category shown.</li>
        <li>Hard: 5 wrong letters allowed, category hidden.</li>
      </ul>
      <p>
        Choose English or Spanish words and a category (animals, food, nature, home, jobs, sports)
        or any. Spanish words ignore accents and Ñ is its own letter.
      </p>
      <h3>Two players</h3>
      <p>One player types a secret word while the other looks away, then passes the device.</p>
      <h3>Help</h3>
      <p>
        A hint counts the listed words that fit what you see and suggests the letter most of them
        contain (hints are counted).
      </p>
      <h3>Controls</h3>
      <p>
        Tap a letter or type it · <kbd>Shift</kbd>+<kbd>H</kbd> hint.
      </p>
    </>
  );
}
