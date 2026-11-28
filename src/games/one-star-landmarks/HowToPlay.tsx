import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada ronda es una reseña de <b>una estrella</b> de un lugar famoso del mundo, escrita por
          un turista muy gruñón. Adivina de qué lugar se trata.
        </p>
        <h3>Cómo se juega</h3>
        <p>
          Empiezas con la primera línea de la reseña. Escribe un nombre y elige el lugar en la
          lista. Si fallas, verás a cuántos kilómetros y en qué dirección está la respuesta desde tu
          intento, su cercanía (100 % en el sitio, 0 % en las antípodas), tu intento en el mapa y
          una línea más de la reseña (tres en total).
        </p>
        <h3>Puntuación</h3>
        <p>
          Cinco intentos: 100 puntos a la primera, luego 75, 50, 30 y 15; 0 si fallas los cinco o te
          rindes.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco lugares, nunca dos seguidos de la misma región, los mismos para todos
          (máximo 500). <b>Sin fin</b>: dificultad (los más famosos, conocidos o todos) y región a
          elegir.
        </p>
        <h3>Datos</h3>
        <p>
          137 lugares con coordenadas y nombres de Wikidata (CC0). Las reseñas son originales,
          escritas para este juego: se quejan de colas, escaleras, precios y el tiempo, nunca de la
          gente ni de la fe.
        </p>
        <h3>Controles</h3>
        <p>
          Escribe en la caja, <kbd>↑</kbd>/<kbd>↓</kbd> para elegir, <kbd>Intro</kbd> para probar,{' '}
          <kbd>Esc</kbd> para borrar. Con ratón o dedo, toca un nombre de la lista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each round is a <b>one-star</b> review of a famous place in the world, written by a very
        grumpy tourist. Work out which place it is.
      </p>
      <h3>Play</h3>
      <p>
        You start with the first line of the review. Type a name and pick the place from the list.
        If you are wrong, you see how many kilometres away and in which direction the answer lies
        from your guess, how close it is (100 % on the spot, 0 % at the antipode), your guess on the
        map and one more line of the review (three in all).
      </p>
      <h3>Scoring</h3>
      <p>
        Five guesses: 100 points first time, then 75, 50, 30 and 15; 0 if all five miss or you give
        up.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five places, never two in a row from the same region, the same for everyone
        (500 max). <b>Endless</b>: pick a difficulty (the most famous, well-known or all) and
        region.
      </p>
      <h3>Data</h3>
      <p>
        137 places with coordinates and names from Wikidata (CC0). The reviews are original, written
        for this game: they grumble about queues, stairs, prices and the weather — never about
        people or faith.
      </p>
      <h3>Controls</h3>
      <p>
        Type in the box, <kbd>↑</kbd>/<kbd>↓</kbd> to choose, <kbd>Enter</kbd> to guess,{' '}
        <kbd>Esc</kbd> to clear. With a mouse or finger, tap a name in the list.
      </p>
    </>
  );
}
