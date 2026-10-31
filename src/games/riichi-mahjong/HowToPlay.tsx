import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Terminar con más puntos tras la ronda del Este (al menos cuatro manos; todos empiezan con
          25 000). Se gana una mano completando cuatro grupos (escaleras de tres del mismo palo o
          tríos iguales) y una pareja, con al menos un <strong>yaku</strong>.
        </p>
        <h3>El turno</h3>
        <ul>
          <li>
            Robas una ficha y descartas otra. Si tu mano queda completa, puedes ganar por{' '}
            <strong>tsumo</strong>.
          </li>
          <li>
            Con la mano cerrada y en espera puedes declarar <strong>riichi</strong> (apuestas 1000):
            ya no cambias la mano, pero ganas un yaku y la opción de dora ocultas.
          </li>
          <li>
            Cuando otro descarta: <strong>ron</strong> si completa tu mano; <strong>pon</strong>{' '}
            (dos iguales + la descartada) o <strong>kan</strong> (tres); <strong>chi</strong>{' '}
            (escalera) solo con el descarte del jugador anterior a ti. Cantar abre la mano: algunos
            yaku solo valen cerrada.
          </li>
          <li>
            <strong>Furiten</strong>: no puedes ganar por ron si alguna de tus esperas está entre
            tus propios descartes, o si dejaste pasar un ron (hasta tu siguiente descarte; en
            riichi, toda la mano).
          </li>
        </ul>
        <h3>Yaku frecuentes</h3>
        <ul>
          <li>
            Riichi; autorrobo con mano cerrada; todo simples (sin 1, 9 ni honores); pinfu (cuatro
            escaleras, espera a dos lados).
          </li>
          <li>
            Trío de dragón, de tu viento o del viento de la ronda; siete parejas; medio color y
            color puro; todo tríos.
          </li>
        </ul>
        <h3>Puntos</h3>
        <p>
          Cada yaku vale han; los dora suman han. Los han y los fu (por la forma de la mano) dan los
          puntos: 5 han son un mangan (8000, o 12 000 si gana la mano quien reparte). Si el muro se
          acaba, quienes estén en espera reciben 3000 de quienes no.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una ficha para descartarla; los botones cantan o declaran · <kbd>H</kbd> pista ·{' '}
          <kbd>P</kbd> pasar · <kbd>Intro</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Finish with the most points after the East round (at least four hands; everyone starts with
        25 000). A hand is won by completing four sets (runs of three in one suit, or three
        identical tiles) and a pair, with at least one <strong>yaku</strong>.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>
          Draw a tile and discard one. If your hand is complete you can win by{' '}
          <strong>tsumo</strong>.
        </li>
        <li>
          With a closed hand one tile from winning you can declare <strong>riichi</strong> (staking
          1000): you can no longer change your hand, but it gives a yaku and the chance of hidden
          dora.
        </li>
        <li>
          When someone discards: <strong>ron</strong> if it completes your hand;{' '}
          <strong>pon</strong> (two matching tiles + the discard) or <strong>kan</strong> (three);{' '}
          <strong>chi</strong> (a run) only from the player before you. Calling opens your hand:
          some yaku only count closed.
        </li>
        <li>
          <strong>Furiten</strong>: you cannot win on a discard if one of your waits is among your
          own discards, or after letting a ron pass (until your next discard; in riichi, for the
          whole hand).
        </li>
      </ul>
      <h3>Common yaku</h3>
      <ul>
        <li>
          Riichi; closed self-draw; all simples (no 1s, 9s or honours); pinfu (four runs, a
          two-sided wait).
        </li>
        <li>
          A triplet of dragons, your seat wind or the round wind; seven pairs; half and full flush;
          all triplets.
        </li>
      </ul>
      <h3>Scoring</h3>
      <p>
        Each yaku is worth han; dora add han. Han and fu (from the hand’s shape) give the points: 5
        han is a mangan (8000, or 12 000 for the dealer). When the wall runs out, players one tile
        from winning collect 3000 from those who are not.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a tile to discard it; the buttons call or declare · <kbd>H</kbd> hint · <kbd>P</kbd>{' '}
        pass · <kbd>Enter</kbd> next hand.
      </p>
    </>
  );
}
