import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Derribar enjambre tras enjambre sin perder tus tres naves.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            El enjambre se balancea en formación y va mandando bichos en picado: un bucle y una
            carrera hacia ti, disparando.
          </li>
          <li>Los comandantes dorados bajan con hasta dos escoltas rojas.</li>
          <li>
            Tu nave dispara un misil cada vez. Un bicho vale el doble (o más) mientras está en
            picado.
          </li>
          <li>
            Un disparo o un choque te cuesta una nave; con 5000 puntos ganas otra. Cada enjambre
            nuevo es más rápido.
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
      <p>Bring down swarm after swarm without losing your three ships.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The swarm sways in formation and keeps sending fliers down: a loop, then a run at you,
          firing.
        </li>
        <li>Gold commanders dive with up to two red guards.</li>
        <li>
          Your ship has one missile in the air at a time. A flier is worth double (or more) while
          diving.
        </li>
        <li>
          A bullet or a collision costs a ship; 5000 points earn another. Each new swarm is quicker.
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
