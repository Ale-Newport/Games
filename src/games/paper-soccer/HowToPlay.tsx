import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Meter el balón en la <strong>portería rival</strong>, o dejar al rival sin ninguna línea
          que trazar.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Campo de 8 × 10 cuadros con porterías de dos cuadros. El balón empieza en el centro;
            Naranja ataca la portería de arriba y saca primero.
          </li>
          <li>
            Cada jugada traza una línea desde el balón hasta uno de los ocho puntos vecinos. No se
            puede repetir una línea ya trazada ni ir por el borde del campo o de las porterías.
          </li>
          <li>
            Si el balón cae en un punto <strong>ya usado</strong> o en el borde, rebota y el mismo
            jugador vuelve a mover.
          </li>
          <li>
            Llegar a la portería rival es gol; meterla en la propia también cuenta para el rival.
            Quien debe mover y no puede, pierde.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca uno de los puntos amarillos junto al balón para chutar hacia él.</li>
          <li>
            Flechas o teclado numérico (<kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd> / <kbd>4</kbd>{' '}
            <kbd>6</kbd> / <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>) para chutar · <kbd>U</kbd>{' '}
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
        Put the ball into the <strong>opponent’s goal</strong>, or leave your opponent no line to
        draw.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A field of 8 × 10 squares with goals two squares wide. The ball starts in the middle;
          Orange attacks the top goal and kicks off.
        </li>
        <li>
          Each move draws a line from the ball to one of the eight neighboring dots. No line may be
          drawn twice, and none may run along the edge of the field or of the goals.
        </li>
        <li>
          If the ball lands on a dot <strong>already used</strong> or on the edge, it bounces and
          the same player moves again.
        </li>
        <li>
          Reaching the opponent’s goal scores; an own goal counts for the opponent. A player who
          must move but cannot loses.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of the yellow dots next to the ball to kick it there.</li>
        <li>
          Arrows or the number pad (<kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd> / <kbd>4</kbd>{' '}
          <kbd>6</kbd> / <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>) to kick · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
