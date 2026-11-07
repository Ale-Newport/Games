import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Unir tus dos lados con una cadena de puentes: <strong>Naranja</strong> de arriba abajo,{' '}
          <strong>Turquesa</strong> de izquierda a derecha.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Cada jugador tiene su propia rejilla de puntos (6 × 5 y 5 × 6), entrelazadas. Las rondas
            alternan quién empieza.
          </li>
          <li>En tu turno tiendes un puente entre dos puntos vecinos de tu color.</li>
          <li>
            Los puentes <strong>no se cruzan</strong>: cada hueco entre cuatro puntos admite un solo
            puente, tuyo o del rival. Cada puente tuyo es también un muro para él.
          </li>
          <li>
            Gana quien primero conecta sus lados; no hay empates. Quien abre siempre puede ganar con
            juego perfecto: ¡ganar en segundo lugar tiene mérito!
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca un hueco libre entre puntos para tender tu puente allí.</li>
          <li>
            Flechas mover · <kbd>Intro</kbd> tender puente · <kbd>U</kbd> deshacer · <kbd>H</kbd>{' '}
            pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Join your two sides with a chain of bridges: <strong>Orange</strong> top to bottom,{' '}
        <strong>Teal</strong> left to right.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Each player has their own grid of dots (6 × 5 and 5 × 6), interleaved. Rounds alternate
          who starts.
        </li>
        <li>On your turn, build a bridge between two neighboring dots of your color.</li>
        <li>
          Bridges <strong>never cross</strong>: each gap between four dots takes a single bridge,
          yours or your opponent’s. Every bridge you build is also a wall for them.
        </li>
        <li>
          The first to connect their sides wins; there are no draws. The opener can always win with
          perfect play — winning second is an achievement!
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a free gap between dots to build your bridge there.</li>
        <li>
          Arrows move · <kbd>Enter</kbd> build · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
