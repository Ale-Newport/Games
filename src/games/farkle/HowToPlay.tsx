import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Sé el primero en llegar a 10 000 puntos (en solitario: llega en el menor número de
          turnos).
        </p>
        <h3>Turno</h3>
        <ul>
          <li>Tira seis dados y aparta al menos una combinación que puntúe.</li>
          <li>
            Después, plántate (los puntos del turno pasan a tu marcador) o tira los dados que
            queden.
          </li>
          <li>
            Si una tirada no tiene nada que puntúe, es un farkle: pierdes los puntos del turno.
          </li>
          <li>Si apartas los seis dados (dados calientes), puedes volver a tirar los seis.</li>
          <li>La primera vez que te plantas, el turno debe valer al menos 500.</li>
          <li>
            Cuando alguien llega a 10 000, los demás juegan un último turno; gana la puntuación más
            alta.
          </li>
        </ul>
        <h3>Puntuación</h3>
        <ul>
          <li>Un 1: 100. Un 5: 50.</li>
          <li>
            Tres iguales: 100 × el número (tres unos, 1000). Cuatro, cinco y seis iguales: 1000,
            2000 y 3000.
          </li>
          <li>
            Escalera 1–6: 1500. Tres parejas: 1500. Dos tríos: 2500. Cuatro iguales y una pareja:
            1500.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar o seguir · <kbd>1</kbd>–<kbd>6</kbd> elegir dado ·{' '}
          <kbd>B</kbd> plantarse ·<kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to 10 000 points (solo: get there in as few turns as you can).</p>
      <h3>A turn</h3>
      <ul>
        <li>Roll six dice and set aside at least one scoring combination.</li>
        <li>Then bank (the turn's points go to your score) or roll the dice left.</li>
        <li>A roll with nothing that scores is a farkle: you lose the turn's points.</li>
        <li>Set all six aside (hot dice) and you may roll all six again.</li>
        <li>Your first bank must be worth at least 500.</li>
        <li>
          When someone reaches 10 000, everyone else has one last turn; the highest score wins.
        </li>
      </ul>
      <h3>Scoring</h3>
      <ul>
        <li>A 1: 100. A 5: 50.</li>
        <li>
          Three of a kind: 100 × the number (three 1s: 1000). Four, five and six of a kind: 1000,
          2000 and 3000.
        </li>
        <li>
          Straight 1–6: 1500. Three pairs: 1500. Two triplets: 2500. Four of a kind with a pair:
          1500.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll or roll on · <kbd>1</kbd>–<kbd>6</kbd> pick a die ·{' '}
        <kbd>B</kbd> bank · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
