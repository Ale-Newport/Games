import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Captura el león</strong> rival, o lleva tu león a la última fila sin que pueda ser
          capturado.
        </p>
        <h3>Animales</h3>
        <ul>
          <li>
            Los puntos de cada ficha indican hacia dónde se mueve una casilla. León: en las 8
            direcciones. Jirafa: recto. Elefante: en diagonal. Pollito: solo hacia delante.
          </li>
          <li>
            Un pollito que llega a la última fila se convierte en gallina (mueve como un general de
            oro: recto o en diagonal hacia delante).
          </li>
        </ul>
        <h3>Reglas</h3>
        <ul>
          <li>Sente (abajo) mueve primero. Se captura moviendo a la casilla del rival.</li>
          <li>
            Los animales capturados van a tu mano; en tu turno puedes colocar uno en cualquier
            casilla vacía (una gallina vuelve como pollito). Un pollito lanzado en la última fila no
            se promociona.
          </li>
          <li>
            Si tu león llega a la última fila y el rival puede capturarlo, la partida sigue: si no
            lo captura en su turno, ganas.
          </li>
          <li>La misma posición tres veces es tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca un animal y luego su destino; para lanzar, toca uno de tu mano y una casilla vacía.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / mover, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        <strong>Capture the enemy lion</strong>, or bring your lion to the far row where it cannot
        be captured.
      </p>
      <h3>Animals</h3>
      <ul>
        <li>
          The dots on each tile show where it can step one square. Lion: all 8 directions. Giraffe:
          straight. Elephant: diagonally. Chick: forward only.
        </li>
        <li>
          A chick reaching the far row becomes a hen (moves like a gold general: straight, or
          diagonally forward).
        </li>
      </ul>
      <h3>Rules</h3>
      <ul>
        <li>Sente (bottom) moves first. Capture by moving onto an enemy animal.</li>
        <li>
          Captured animals join your hand; on your turn you may place one on any empty square (a hen
          comes back as a chick). A chick dropped on the far row does not promote.
        </li>
        <li>
          If your lion reaches the far row but can be captured, play goes on: if the opponent does
          not capture it on their turn, you win.
        </li>
        <li>The same position three times is a draw.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap an animal, then its destination; to drop, tap one in your hand, then an empty square.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
