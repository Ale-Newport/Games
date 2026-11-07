import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Terminar con <strong>un solo montón</strong> (o con los menos posibles).
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Toca el mazo para repartir una carta a la derecha de la fila.</li>
          <li>
            Un montón puede ir sobre el de su <strong>izquierda</strong> o sobre el que está{' '}
            <strong>tres puestos a la izquierda</strong> si sus cartas de arriba son del mismo palo
            o del mismo rango. Se mueve el montón entero y la fila se cierra.
          </li>
          <li>
            Puedes mover cuando quieras. Se gana con todo repartido y un único montón; si el mazo se
            acaba sin jugadas, la partida termina.
          </li>
          <li>Puntuación: montones que quedan (menos es mejor).</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca un montón y luego su destino, o tócalo dos veces (prueba primero tres a la
            izquierda). También puedes arrastrar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> montón · <kbd>Intro</kbd> coger / soltar · <kbd>D</kbd>{' '}
            repartir · <kbd>A</kbd> mover solo · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>N</kbd> nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        End with <strong>a single pile</strong> (or as few as you can).
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Tap the stock to deal a card to the right end of the row.</li>
        <li>
          A pile may go onto the pile to its <strong>left</strong>, or the one{' '}
          <strong>three places to its left</strong>, if their top cards share a suit or a rank. The
          whole pile moves and the row closes up.
        </li>
        <li>
          Move whenever you like. You win with everything dealt and one pile; if the stock runs out
          with no move left, the deal ends.
        </li>
        <li>Score: the piles left (lower is better).</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a pile, then where it goes, or tap it twice (three to the left is tried first). You
          can also drag.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> pile · <kbd>Enter</kbd> pick / drop · <kbd>D</kbd> deal ·{' '}
          <kbd>A</kbd> auto-move · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
