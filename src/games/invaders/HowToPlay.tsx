import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Aguantar oleada tras oleada de invasores y sumar todos los puntos que puedas.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La formación marcha de lado a lado y baja al tocar un borde; cuantos menos quedan, más
            deprisa van.
          </li>
          <li>
            Tu cañón dispara de uno en uno: hasta que el disparo no acierta o sale de la pantalla,
            no puedes disparar otro.
          </li>
          <li>
            Los invasores valen 10, 20 o 30 puntos según la fila; la nave misteriosa de arriba,
            entre 50 y 300.
          </li>
          <li>Los escudos te protegen, pero se desgastan con los disparos de ambos lados.</li>
          <li>
            Tienes tres cañones (uno más a los 1500 puntos). Si los invasores llegan a tu fila, se
            acabó.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> o los botones táctiles · <kbd>Espacio</kbd> dispara ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Hold out wave after wave of invaders and score as many points as you can.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The formation marches side to side and steps down at each edge; the fewer remain, the
          faster they go.
        </li>
        <li>
          Your cannon fires one shot at a time: until it hits or leaves the screen you cannot fire
          another.
        </li>
        <li>
          Invaders are worth 10, 20 or 30 points by row; the mystery ship at the top, 50 to 300.
        </li>
        <li>Shields protect you but wear away under fire from both sides.</li>
        <li>
          You have three cannons (one more at 1500 points). Invaders reaching your row end the game.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> or the touch buttons · <kbd>Space</kbd> fires · <kbd>P</kbd> pause
        · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
