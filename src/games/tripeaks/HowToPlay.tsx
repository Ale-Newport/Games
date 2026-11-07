import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Despejar las <strong>28 cartas de los tres picos</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tres picos de cartas superpuestas en filas de 3, 6, 9 y 10. Solo la fila de abajo
            empieza boca arriba; una carta se destapa al quedar descubierta.
          </li>
          <li>
            Juega una carta descubierta al descarte si es <strong>un rango mayor o menor</strong>{' '}
            que la de arriba, sin importar el palo. El rey y el as se tocan.
          </li>
          <li>Si nada encaja, gira una carta del mazo al descarte. El mazo se usa una sola vez.</li>
          <li>
            Puntos: cada carta jugada suma tantos puntos como lleve la racha (1, 2, 3…; robar la
            corta), +15 por cada cima y +30 por despejar los tres picos.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una carta descubierta para jugarla; toca el mazo para robar.</li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> carta · <kbd>Intro</kbd> jugar · <kbd>D</kbd> robar ·{' '}
            <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>N</kbd> nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Clear all <strong>28 cards of the three peaks</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Three peaks of overlapping cards in rows of 3, 6, 9 and 10. Only the bottom row starts
          face up; a card turns up once uncovered.
        </li>
        <li>
          Play an uncovered card onto the waste if it is <strong>one rank higher or lower</strong>{' '}
          than its top card, whatever the suit. King and ace touch.
        </li>
        <li>
          When nothing fits, turn a card from the stock onto the waste. The stock is used once.
        </li>
        <li>
          Score: each card played scores the length of the current run (1, 2, 3…; drawing ends it),
          +15 per peak top and +30 for clearing all three.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap an uncovered card to play it; tap the stock to draw.</li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> card · <kbd>Enter</kbd> play · <kbd>D</kbd> draw · <kbd>U</kbd>{' '}
          undo · <kbd>H</kbd> hint · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
