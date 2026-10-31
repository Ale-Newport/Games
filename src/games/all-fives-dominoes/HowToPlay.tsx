import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el primero en llegar a 150 puntos, sobre todo puntuando mientras juegas.</p>
        <h3>La mano</h3>
        <ul>
          <li>
            Doble seis, con pozo: siete fichas por jugador entre dos, cinco entre tres o cuatro. Se
            roba hasta que algo encaje.
          </li>
          <li>
            La primera mano la abre el doble más alto; después sale quien ganó la mano anterior. Un
            doble de salida es el <strong>giratorio</strong>: cuando sus dos costados tienen ficha,
            se puede jugar también por arriba y por abajo (cuatro extremos).
          </li>
        </ul>
        <h3>Puntos</h3>
        <ul>
          <li>
            Si tras tu jugada los extremos abiertos suman 5, 10, 15, 20… te apuntas esa suma. Un
            doble en un extremo cuenta sus dos mitades; el giratorio con solo un costado jugado
            también cuenta entero.
          </li>
          <li>
            Quien se queda sin fichas se apunta además los puntos de las demás manos, redondeados a
            cinco.
          </li>
          <li>
            Si nadie puede jugar, la mano más baja se apunta los de las demás menos los suyos,
            redondeados a cinco.
          </li>
          <li>Gana quien llegue antes a 150, aunque sea a mitad de mano.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una ficha iluminada y, si cabe en varios extremos, elige cuál · <kbd>D</kbd> robar ·{' '}
          <kbd>P</kbd> pasar · <kbd>H</kbd> pista · <kbd>Intro</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to reach 150 points, mostly by scoring as you play.</p>
      <h3>A hand</h3>
      <ul>
        <li>
          Double-six with a boneyard: seven tiles each for two players, five for three or four. Draw
          until something fits.
        </li>
        <li>
          The highest double opens the first hand; later the previous hand’s winner leads. An
          opening double is the <strong>spinner</strong>: once both of its sides hold a tile, it can
          be played on at the top and bottom too (four open ends).
        </li>
      </ul>
      <h3>Scoring</h3>
      <ul>
        <li>
          If after your play the open ends add up to 5, 10, 15, 20… you score that sum. A double at
          an end counts both halves; so does the spinner while only one of its sides is played.
        </li>
        <li>Going out also scores the pips in the other hands, rounded to the nearest five.</li>
        <li>
          If nobody can play, the lowest hand scores the others’ pips minus its own, rounded to
          five.
        </li>
        <li>The first to 150 wins, even in the middle of a hand.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a lit tile and, if it fits several ends, choose one · <kbd>D</kbd> draw · <kbd>P</kbd>{' '}
        pass · <kbd>H</kbd> hint · <kbd>Enter</kbd> next hand.
      </p>
    </>
  );
}
