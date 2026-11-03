import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Remontar el río lo más lejos posible, derribando puentes y patrullas.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Tu avión avanza solo; tú lo diriges, aceleras o frenas y disparas (una bala a la vez).
          </li>
          <li>
            El combustible se gasta, más deprisa a toda velocidad. Pasa por encima de un depósito de
            rayas para llenarlo; si le disparas, sumas puntos pero lo pierdes.
          </li>
          <li>
            Barcos (30), helicópteros (60) y cazas (100) patrullan; los barcos y helicópteros se
            mueven al acercarte.
          </li>
          <li>
            Cada tramo acaba en un puente que hay que derribar (500); el último puente superado es
            donde sale tu siguiente avión.
          </li>
          <li>
            Tocar la orilla, una isla, un enemigo o un puente, o quedarte sin combustible, cuesta un
            avión (tienes cuatro).
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> dirigen · <kbd>↑</kbd> acelera · <kbd>↓</kbd> frena ·{' '}
          <kbd>Espacio</kbd> dispara · o mantén un dedo en la pantalla para dirigir y usa los
          botones · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Fly as far up the river as you can, shooting down bridges and patrols.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Your jet flies on by itself; you steer it, speed up or slow down, and fire (one shot at a
          time).
        </li>
        <li>
          Fuel burns as you go, faster at full speed. Fly over a striped depot to fill up; shoot it
          and you score but lose it.
        </li>
        <li>
          Boats (30), helicopters (60) and jets (100) patrol; boats and helicopters start moving as
          you come near.
        </li>
        <li>
          Each stretch ends at a bridge you must shoot down (500); the last bridge passed is where
          your next jet starts.
        </li>
        <li>
          Touching a bank, an island, an enemy or a bridge, or running out of fuel, costs a jet (you
          have four).
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> steer · <kbd>↑</kbd> faster · <kbd>↓</kbd> slower ·{' '}
        <kbd>Space</kbd> fires · or hold a finger on the screen to steer and use the buttons ·{' '}
        <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
