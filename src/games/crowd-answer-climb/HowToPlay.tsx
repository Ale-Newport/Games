import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Subir lo más alto posible diciendo <strong>lo que diría la mayoría</strong>. Cada punto
          eleva tu globo 1 km; el máximo son 700 puntos (700 km, la órbita baja).
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Siete preguntas abiertas («Nombra una fruta»). Cada una se muestra 3 segundos y luego
            tienes 25 para responder.
          </li>
          <li>
            Tienes <strong>tres intentos</strong> por pregunta: una respuesta que no está en la hoja
            gasta uno. Al tercer fallo, o si se acaba el tiempo, la pregunta vale 0.
          </li>
          <li>
            Puntos según lo popular que es la respuesta: Favorita del público 100 · Segunda
            naturaleza 85 · Elección popular 60 · De nicho 30 · Aire enrarecido 15 · Estrella
            solitaria 10.
          </li>
          <li>
            Se ignoran mayúsculas, tildes, artículos y plurales, y se perdonan erratas pequeñas
            cuando la respuesta es inequívoca.
          </li>
        </ul>
        <h3>Modos</h3>
        <ul>
          <li>
            <strong>Ascenso de hoy</strong>: las mismas siete preguntas para todos en cada fecha; un
            intento al día y racha diaria.
          </li>
          <li>
            <strong>Ilimitado</strong>: siete preguntas al azar cuando quieras.
          </li>
          <li>
            <strong>Fiesta</strong>: de 2 a 6 jugadores por turnos en el mismo dispositivo; gana
            quien suba más.
          </li>
          <li>
            <strong>Ver a la IA</strong>: la IA juega una partida.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Escribe y pulsa <kbd>Intro</kbd> o «Subir». Al terminar, revisa todas las respuestas
          posibles y copia un resultado sin spoilers.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Climb as high as you can by saying <strong>what most people would say</strong>. Every point
        lifts your balloon 1 km; the maximum is 700 points (700 km, low Earth orbit).
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Seven open prompts (“Name a fruit”). Each is shown for 3 seconds, then you have 25 to
          answer.
        </li>
        <li>
          You have <strong>three tries</strong> per prompt: an answer that is not on the sheet uses
          one. On the third miss, or when time runs out, the prompt scores 0.
        </li>
        <li>
          Points by popularity: Crowd Favourite 100 · Second Nature 85 · Popular Pick 60 · Niche 30
          · Rare Air 15 · Lone Star 10.
        </li>
        <li>
          Case, accents, articles and plurals are ignored, and small typos are forgiven when the
          answer is unambiguous.
        </li>
      </ul>
      <h3>Modes</h3>
      <ul>
        <li>
          <strong>Today’s climb</strong>: the same seven prompts for everyone on a date; one try a
          day, with a daily streak.
        </li>
        <li>
          <strong>Unlimited</strong>: seven random prompts whenever you like.
        </li>
        <li>
          <strong>Party</strong>: 2–6 players take turns on one device; the highest flyer wins.
        </li>
        <li>
          <strong>Watch the AI</strong>: the AI plays a run.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Type and press <kbd>Enter</kbd> or “Go”. At the end, review every possible answer and copy a
        spoiler-free result.
      </p>
    </>
  );
}
