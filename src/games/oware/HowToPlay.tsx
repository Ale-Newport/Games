import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Capturar <strong>más de 24 semillas</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Seis casillas por jugador con cuatro semillas cada una; no hay almacenes en juego (las
            capturas se apartan). Empieza Sur.
          </li>
          <li>
            Toma las semillas de una de tus casillas y siémbralas una a una en sentido antihorario.
            Con 12 o más, la casilla de salida se salta al dar la vuelta.
          </li>
          <li>
            Si tu última semilla deja una casilla del rival con 2 o 3 semillas, las capturas, y
            también las casillas anteriores del rival que hayan quedado con 2 o 3.
          </li>
          <li>
            Si esa captura se llevara todas las semillas del rival, no se captura nada (regla del
            gran slam).
          </li>
          <li>
            Si el rival no tiene semillas, debes jugar una casilla que le dé alguna. Si no puedes,
            la partida acaba.
          </li>
          <li>
            Gana quien captura más de 24. Si la partida se repite o se alarga, cada uno se queda lo
            de su lado.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una de tus casillas con semillas (resaltadas) para sembrar.</li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> elegir casilla, <kbd>Intro</kbd> sembrar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Capture <strong>more than 24 seeds</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Six pits per player with four seeds each; there are no stores in play (captures are set
          aside). South starts.
        </li>
        <li>
          Pick up the seeds of one of your pits and sow them one by one counter-clockwise. With 12
          or more, the starting pit is skipped as the sowing laps the board.
        </li>
        <li>
          If your last seed leaves an opponent’s pit with 2 or 3 seeds, you capture it, along with
          the opponent’s pits just before it that also hold 2 or 3.
        </li>
        <li>
          If that would capture every one of your opponent’s seeds, nothing is captured (grand slam
          rule).
        </li>
        <li>
          If your opponent has no seeds you must play a pit that gives them some. If you cannot, the
          game ends.
        </li>
        <li>
          Capturing more than 24 wins. If the game repeats or drags on, each keeps the seeds on
          their side.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of your pits with seeds (highlighted) to sow it.</li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> choose a pit, <kbd>Enter</kbd> sow · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
