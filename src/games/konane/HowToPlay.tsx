import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Hacer el <strong>último salto</strong>: el rival se queda sin saltos y pierde.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Tablero de 6×6 lleno de piedras negras y blancas en damero.</li>
          <li>
            Apertura: las negras retiran una piedra negra del centro o de una esquina; las blancas
            retiran una piedra blanca junto a ese hueco.
          </li>
          <li>
            Después, cada turno una piedra salta en horizontal o vertical sobre una piedra rival
            vecina hasta la casilla vacía de detrás, y la captura.
          </li>
          <li>
            Puedes seguir saltando con la misma piedra <strong>en la misma dirección</strong>, una
            piedra rival cada vez, hasta donde quieras.
          </li>
          <li>Quien no puede saltar pierde. No hay tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            En la apertura toca la piedra a retirar (bordes naranjas). Luego toca tu piedra y una
            casilla de destino (punto verde); las más lejanas son saltos múltiples.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Make the <strong>last jump</strong>: your opponent runs out of jumps and loses.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>A 6×6 board full of black and white stones in a checkerboard.</li>
        <li>
          Opening: Black removes a black stone from the middle or a corner; White removes a white
          stone next to that hole.
        </li>
        <li>
          Then each turn a stone jumps horizontally or vertically over an adjacent enemy stone into
          the empty cell beyond, capturing it.
        </li>
        <li>
          The same stone may keep jumping <strong>in the same direction</strong>, one enemy stone at
          a time, as far as you choose.
        </li>
        <li>Whoever cannot jump loses. There are no draws.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          In the opening tap the stone to remove (orange borders). Then tap your stone and a landing
          cell (green dot); the farther ones are multiple jumps.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
