import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Cómo se juega</h3>
        <ol>
          <li>Todos escriben una frase (la mitad del tiempo del paso).</li>
          <li>Cada frase pasa al siguiente jugador, que la dibuja (tiempo completo).</li>
          <li>El dibujo pasa al siguiente, que lo describe sin ver la frase original.</li>
          <li>
            Se alterna dibujar y describir hasta que cada cadena tiene tantos pasos como jugadores.
          </li>
          <li>El álbum enseña cada cadena paso a paso.</li>
        </ol>
        <p>
          Con varias personas en el dispositivo, cada una juega su paso tras la pantalla de cambio,
          sin mirar los de los demás. Los bots dibujan garabatos humanos reales y describen con un
          reconocedor de dibujos.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>How to play</h3>
      <ol>
        <li>Everyone writes a sentence (half the step time).</li>
        <li>Each sentence passes to the next player, who draws it (full time).</li>
        <li>
          The drawing passes on to the next player, who describes it without seeing the original.
        </li>
        <li>Drawing and describing alternate until each chain has as many steps as players.</li>
        <li>The album shows every chain step by step.</li>
      </ol>
      <p>
        With several people on the device, each plays their step behind the hand-over screen without
        peeking. Bots draw real human doodles and describe with a doodle recognizer.
      </p>
    </>
  );
}
