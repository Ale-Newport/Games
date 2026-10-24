import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Vaciar la <strong>fila delantera del rival</strong> o dejarle sin ninguna jugada.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 4 × 8. Cada jugador tiene las dos filas de su lado (delantera y trasera), 16
            casillas con dos semillas cada una. Empieza Sur.
          </li>
          <li>
            Tus 16 casillas forman un circuito: toma todas las semillas de una casilla con dos o más
            y siémbralas una a una alrededor de tu circuito, en el sentido que elijas.
          </li>
          <li>
            Si la última semilla cae en una casilla <strong>delantera ocupada</strong> y la casilla
            rival de enfrente tiene semillas, las capturas y las siembras en tu fila delantera
            empezando por el extremo de ese lado (izquierdo si la captura fue en tu mitad izquierda,
            derecho si fue en la derecha), hacia el centro.
          </li>
          <li>
            Si cae en cualquier otra casilla ocupada, recoges todo lo que hay y sigues sembrando en
            el mismo sentido. Si cae en una casilla vacía, el turno acaba.
          </li>
          <li>Capturar es obligatorio: si alguna jugada captura, debes elegir una de ellas.</li>
          <li>
            Pierde quien se queda con la fila delantera vacía o sin casillas con dos semillas. Tras
            300 jugadas gana quien tenga más semillas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una de tus casillas resaltadas y luego la casilla vecina (en verde) hacia la que
            quieras sembrar, o usa los botones de sentido.
          </li>
          <li>
            Flechas mover · <kbd>Intro</kbd> elegir · <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Empty your <strong>opponent’s front row</strong>, or leave them without a move.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 4 × 8 board. Each player owns the two rows on their side (front and back): 16 pits with
          two seeds each. South starts.
        </li>
        <li>
          Your 16 pits form a loop: take all the seeds of a pit holding two or more and sow them one
          by one around your loop, in the direction of your choice.
        </li>
        <li>
          If the last seed lands in an <strong>occupied front pit</strong> and the opponent’s pit
          facing it has seeds, you capture them and sow them into your front row starting from the
          end on that side (left if the capture was in your left half, right if in the right half),
          toward the center.
        </li>
        <li>
          If it lands in any other occupied pit, pick up everything there and keep sowing the same
          way. If it lands in an empty pit, the turn ends.
        </li>
        <li>Capturing is compulsory: if any move captures, you must choose one of them.</li>
        <li>
          You lose with an empty front row or no pit holding two seeds. After 300 moves, more seeds
          wins.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap one of your highlighted pits, then the neighboring pit (in green) you want to sow
          toward, or use the direction buttons.
        </li>
        <li>
          Arrows move · <kbd>Enter</kbd> choose · <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
