import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sumar más puntos que los bots adivinando dibujos rápido y dibujando bien.</p>
        <h3>Turnos</h3>
        <ul>
          <li>
            Cada ronda, todos dibujan una vez. Quien dibuja elige una de tres palabras (15 s) y
            tiene el tiempo de la sala para dibujarla.
          </li>
          <li>
            Los demás escriben respuestas en el chat. La palabra se muestra como huecos y se revelan
            letras a partir del 40 % del tiempo.
          </li>
          <li>
            Acertar da de 400 a 50 puntos según lo pronto que aciertes (25 menos por cada uno que
            acertó antes). Quien dibuja gana 100 por cada acierto más un extra si lo adivinan
            pronto.
          </li>
          <li>Si tu respuesta está a una letra, verás «¡está cerca!».</li>
        </ul>
        <h3>Bots</h3>
        <p>
          Dibujan garabatos humanos reales de Quick, Draw! (Google, CC BY 4.0) y adivinan con un
          reconocedor entrenado con esos datos, cada uno con su propia rapidez y prudencia. Las
          palabras son las 60 categorías que el reconocedor conoce.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Outscore the bots by guessing drawings fast and drawing well.</p>
      <h3>Turns</h3>
      <ul>
        <li>
          Each round everyone draws once. The drawer picks one of three words (15 s) and has the
          room’s time to draw it.
        </li>
        <li>
          The others type guesses in the chat. The word shows as blanks, with letters revealed from
          40% of the time on.
        </li>
        <li>
          A correct guess scores 400 down to 50 depending on how early it comes (25 less per earlier
          guesser). The drawer scores 100 per guesser plus a bonus when guessed quickly.
        </li>
        <li>If your guess is one letter off, you will see “is close!”.</li>
      </ul>
      <h3>Bots</h3>
      <p>
        They draw real human doodles from Quick, Draw! (Google, CC BY 4.0) and guess with a
        recognizer trained on that data, each with its own speed and caution. Words are the 60
        categories the recognizer knows.
      </p>
    </>
  );
}
