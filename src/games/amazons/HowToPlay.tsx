import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser el <strong>último que puede mover</strong>: quien no puede hacer un turno completo
          pierde.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 10 × 10. Cada jugador tiene cuatro amazonas (blancas en a4, d1, g1, j4;
            negras en a7, d10, g10, j7). Las rondas alternan quién empieza.
          </li>
          <li>
            Un turno tiene dos partes: mueve una de tus amazonas como una reina de ajedrez (en línea
            recta o diagonal, sin saltar nada) y después <strong>dispara una flecha</strong> desde
            su nueva casilla, también como una reina.
          </li>
          <li>
            La flecha quema la casilla donde cae: nadie puede volver a pisarla ni cruzarla. No se
            captura nada.
          </li>
          <li>
            Con las flechas se cierran zonas; intenta encerrar espacio para tus amazonas y dejar sin
            sitio a las del rival. No hay empates.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una amazona, luego la casilla a la que va (puntos verdes) y después dónde dispara
            (puntos rojos). Toca la amazona movida para cambiar su destino o pulsa Cancelar.
          </li>
          <li>
            Flechas mover · <kbd>Intro</kbd> elegir · <kbd>Esc</kbd> retroceder · <kbd>U</kbd>{' '}
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
        Be the <strong>last one able to move</strong>: the player who cannot make a full turn loses.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 10 × 10 board. Each player has four amazons (White on a4, d1, g1, j4; Black on a7, d10,
          g10, j7). Rounds alternate who starts.
        </li>
        <li>
          A turn has two parts: move one of your amazons like a chess queen (straight or diagonal,
          never jumping) and then <strong>shoot an arrow</strong> from its new square, also like a
          queen.
        </li>
        <li>
          The arrow burns the square it lands on: nobody may stand on or cross it again. Nothing is
          captured.
        </li>
        <li>
          Arrows close off areas; fence in space for your amazons and leave your opponent’s without
          room. There are no draws.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap an amazon, then the square it goes to (green dots), then where it shoots (red dots).
          Tap the moved amazon to change its square, or press Cancel.
        </li>
        <li>
          Arrows move · <kbd>Enter</kbd> choose · <kbd>Esc</kbd> step back · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
