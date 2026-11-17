import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Bucear lo más hondo posible dando respuestas <strong>que poca gente diría</strong>. Cada
          punto hunde a tu buzo 10 metros; el máximo son 700 puntos (7000 m, el fondo de la fosa).
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Siete preguntas abiertas («Nombra un ave»). Cada una se muestra 3 segundos y luego
            tienes 25 para responder.
          </li>
          <li>
            La primera respuesta aceptada cierra la pregunta y no se puede cambiar. Si no está en la
            hoja de respuestas («sin eco»), prueba otra mientras quede tiempo.
          </li>
          <li>
            Puntos según lo rara que es la respuesta: Banco de cebo 10 · Señuelo 15 (parece
            ingeniosa, pero todos la piensan) · Cardumen 30 · Hallazgo de arrecife 60 · Hallazgo
            profundo 85 · Perla abisal 100 (respuestas premio elegidas a mano, con dato curioso).
          </li>
          <li>Si se acaba el tiempo, la pregunta vale 0.</li>
          <li>
            Se ignoran mayúsculas, tildes, artículos y plurales, y se perdonan erratas pequeñas
            cuando la respuesta es inequívoca. En una partida en español también vale el nombre
            exacto en inglés.
          </li>
        </ul>
        <h3>Modos</h3>
        <ul>
          <li>
            <strong>Inmersión de hoy</strong>: las mismas siete preguntas para todos en cada fecha;
            un intento al día y racha diaria.
          </li>
          <li>
            <strong>Ilimitado</strong>: siete preguntas al azar cuando quieras.
          </li>
          <li>
            <strong>Fiesta</strong>: de 2 a 6 jugadores por turnos en el mismo dispositivo; gana
            quien baje más.
          </li>
          <li>
            <strong>Ver a la IA</strong>: un buzo experto juega una partida.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Escribe y pulsa <kbd>Intro</kbd> o «Bucear». Al terminar, revisa todas las respuestas
          posibles y copia un resultado sin spoilers.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Dive as deep as you can by giving answers <strong>few people would say</strong>. Every point
        sinks your diver 10 metres; the maximum is 700 points (7,000 m, the trench floor).
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Seven open prompts (“Name a bird”). Each is shown for 3 seconds, then you have 25 to
          answer.
        </li>
        <li>
          Your first accepted answer locks the prompt in. If an answer is not on the answer sheet
          (“no echo”), try another while time remains.
        </li>
        <li>
          Points by rarity: Bait Ball 10 · Decoy 15 (feels clever, but everyone thinks of it) ·
          Shoal 30 · Reef Find 60 · Deep Find 85 · Abyssal Pearl 100 (hand-picked prize answers with
          a fun fact).
        </li>
        <li>If time runs out the prompt scores 0.</li>
        <li>
          Case, accents, articles and plurals are ignored, and small typos are forgiven when the
          answer is unambiguous. A Spanish run also accepts the exact English name.
        </li>
      </ul>
      <h3>Modes</h3>
      <ul>
        <li>
          <strong>Today’s dive</strong>: the same seven prompts for everyone on a date; one try a
          day, with a daily streak.
        </li>
        <li>
          <strong>Unlimited</strong>: seven random prompts whenever you like.
        </li>
        <li>
          <strong>Party</strong>: 2–6 players take turns on one device; the deepest diver wins.
        </li>
        <li>
          <strong>Watch the AI</strong>: an expert diver plays a run.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Type and press <kbd>Enter</kbd> or “Dive”. At the end, review every possible answer and copy
        a spoiler-free result.
      </p>
    </>
  );
}
