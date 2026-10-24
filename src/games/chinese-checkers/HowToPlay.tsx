import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser el primero en llevar tus diez canicas a la <strong>punta opuesta</strong> de la
          estrella.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Estrella de 121 agujeros. Cada jugador empieza con diez canicas en una punta; juegan las
            dos puntas enfrentadas. Las rondas alternan quién empieza.
          </li>
          <li>
            En tu turno mueves una canica: a un agujero vecino vacío (seis direcciones){' '}
            <strong>o</strong> una serie de saltos.
          </li>
          <li>
            Un salto pasa por encima de una canica vecina, de cualquier color, al agujero vacío
            justo detrás, en línea recta. Puedes encadenar saltos en distintas direcciones y parar
            cuando quieras. No se captura nada.
          </li>
          <li>
            Una canica que ya ha llegado a la punta rival puede moverse dentro, pero no salir.
          </li>
          <li>
            Ganas cuando todos los agujeros de la punta rival están ocupados y al menos uno por una
            canica tuya.
          </li>
          <li>Tras 400 jugadas gana quien tenga sus canicas más cerca de la meta.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una de tus canicas y luego uno de los agujeros marcados.</li>
          <li>
            Flechas mover · <kbd>Intro</kbd> elegir / mover · <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Be the first to bring your ten marbles into the <strong>opposite point</strong> of the star.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 121-hole star. Each player starts with ten marbles in one point; the two facing points
          are used. Rounds alternate who starts.
        </li>
        <li>
          On your turn move one marble: to an empty neighboring hole (six directions){' '}
          <strong>or</strong> a series of hops.
        </li>
        <li>
          A hop goes over an adjacent marble of any color to the empty hole right behind it, in a
          straight line. Chain hops in different directions and stop whenever you like. Nothing is
          captured.
        </li>
        <li>A marble that has reached the opposite point may move inside it but not leave.</li>
        <li>
          You win when every hole of the opposite point is occupied and at least one by your
          marbles.
        </li>
        <li>After 400 moves the player whose marbles are closer to their goal wins.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of your marbles, then one of the marked holes.</li>
        <li>
          Arrows move · <kbd>Enter</kbd> pick / move · <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
