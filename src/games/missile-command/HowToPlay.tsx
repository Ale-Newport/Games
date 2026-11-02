import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Proteger las seis ciudades de los cohetes durante tantas oleadas como puedas.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Toca un punto del cielo para lanzar allí un interceptor desde el lanzador más cercano
            con munición (diez por lanzador y oleada; el del centro es más rápido).
          </li>
          <li>
            Al llegar estalla: la explosión crece y se apaga, y destruye los cohetes que atrapa (25
            puntos × el multiplicador de la oleada). Un cohete destruido estalla a su vez.
          </li>
          <li>
            Apunta por delante del cohete: tarda en llegar. Desde la oleada 3 algunos se dividen.
          </li>
          <li>
            Un impacto destruye una ciudad o deja un lanzador fuera de combate hasta la oleada
            siguiente. Al despejar el cielo ganas puntos por la munición y las ciudades que quedan,
            y cada 10 000 puntos se reconstruye una ciudad. Sin ciudades, se acabó.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca o haz clic en el cielo · o mueve la mira con las flechas y dispara con{' '}
          <kbd>Espacio</kbd> · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Protect the six cities from the rockets for as many waves as you can.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Tap a point in the sky to send an interceptor there from the nearest launcher with rounds
          left (ten per launcher each wave; the middle one is faster).
        </li>
        <li>
          It bursts on arrival: the blast grows and fades, destroying every rocket inside (25 points
          × the wave multiplier). A destroyed rocket bursts too.
        </li>
        <li>Aim ahead of a rocket — interceptors take time. From wave 3 some rockets split.</li>
        <li>
          A strike destroys a city or puts a launcher out of action until the next wave. Clearing
          the sky earns points for rounds and cities left, and every 10 000 points rebuilds a city.
          With no cities left, the game is over.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap or click the sky · or move the crosshair with the arrows and fire with <kbd>Space</kbd>{' '}
        · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
