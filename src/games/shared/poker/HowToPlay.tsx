import type { Locale } from '../../../core/i18n';
import type { PokerVariant } from './engine';

/** Rules for the community-card games; the Omaha differences are spelled out where they apply. */
export function PokerRules({ locale, variant }: { locale: Locale; variant: PokerVariant }) {
  const omaha = variant.id === 'omaha';
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Quedarte con todas las fichas de la mesa en un torneo: todos empiezan con 1500 y las
          ciegas suben cada diez manos. Solo fichas de juego, nunca dinero real.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>
            El botón del repartidor (D) avanza cada mano; los dos jugadores a su izquierda ponen la{' '}
            <strong>ciega pequeña</strong> y la <strong>ciega grande</strong> (con dos jugadores, el
            botón pone la pequeña).
          </li>
          <li>
            Cada jugador recibe <strong>{omaha ? 'cuatro' : 'dos'} cartas propias</strong>. Luego
            salen cinco cartas comunitarias: el <em>flop</em> (tres), el <em>turn</em> y el{' '}
            <em>river</em>, con una ronda de apuestas antes de cada una y otra al final.
          </li>
          <li>
            En tu turno puedes <strong>retirarte</strong>, <strong>pasar</strong> (si no hay
            apuesta), <strong>igualar</strong> o <strong>subir</strong>.{' '}
            {omaha
              ? 'Es «pot-limit»: como mucho subes el tamaño del bote (contando lo que igualas).'
              : 'Es «sin límite»: puedes apostar todas tus fichas en cualquier momento.'}{' '}
            Una subida es al menos tan grande como la anterior.
          </li>
          <li>
            Si todos los demás se retiran, ganas el bote sin enseñar. Si no, en el enfrentamiento
            final gana la mejor mano de cinco cartas{' '}
            {omaha ? (
              <>
                usando <strong>exactamente dos</strong> de tus cuatro cartas y{' '}
                <strong>exactamente tres</strong> de la mesa
              </>
            ) : (
              'combinando tus dos cartas y las cinco de la mesa como quieras'
            )}
            .
          </li>
          <li>
            Quien va con todo y tiene menos fichas solo opta al bote que pudo cubrir; el resto va a
            botes laterales.
          </li>
        </ul>
        <h3>Manos, de mejor a peor</h3>
        <p>
          Escalera de color · póker · full · color · escalera (el as puede ir abajo: A-2-3-4-5) ·
          trío · doble pareja · pareja · carta alta.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>
            Botones para retirarte, pasar o igualar y subir; elige la cantidad con el deslizador o
            con los atajos (mínimo, medio bote, bote, todo). «Pista» estima tus opciones.
          </li>
          <li>
            <kbd>F</kbd> retirarse · <kbd>C</kbd> pasar/igualar · <kbd>R</kbd> subir · <kbd>A</kbd>{' '}
            todo · <kbd>←</kbd>/<kbd>→</kbd> tamaño · <kbd>H</kbd> pista · <kbd>N</kbd> siguiente
            mano.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Win every chip at the table in a sit-and-go: everyone starts with 1500 and the blinds rise
        every ten hands. Play chips only, never real money.
      </p>
      <h3>A hand</h3>
      <ul>
        <li>
          The dealer button (D) moves round each hand; the two players to its left post the{' '}
          <strong>small blind</strong> and the <strong>big blind</strong> (heads-up, the button
          posts the small blind).
        </li>
        <li>
          Everyone gets <strong>{omaha ? 'four' : 'two'} hole cards</strong>. Then five community
          cards come out — the <em>flop</em> (three), the <em>turn</em> and the <em>river</em> —
          with a betting round before each and one at the end.
        </li>
        <li>
          On your turn you can <strong>fold</strong>, <strong>check</strong> (when there is no bet),{' '}
          <strong>call</strong> or <strong>raise</strong>.{' '}
          {omaha
            ? 'It is pot-limit: a raise is at most the size of the pot (counting your call).'
            : 'It is no-limit: you may bet all your chips at any time.'}{' '}
          A raise is at least as big as the last one.
        </li>
        <li>
          If everyone else folds you win the pot without showing. Otherwise the best five-card hand
          wins at showdown,{' '}
          {omaha ? (
            <>
              using <strong>exactly two</strong> of your four cards and{' '}
              <strong>exactly three</strong> from the board
            </>
          ) : (
            'using any mix of your two cards and the five on the board'
          )}
          .
        </li>
        <li>
          A player all-in for less can only win what they covered; the rest goes to side pots.
        </li>
      </ul>
      <h3>Hands, best first</h3>
      <p>
        Straight flush · four of a kind · full house · flush · straight (the ace may play low:
        A-2-3-4-5) · three of a kind · two pair · pair · high card.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>
          Buttons to fold, check or call, and raise; pick the amount with the slider or the presets
          (minimum, half pot, pot, all-in). "Hint" estimates your chances.
        </li>
        <li>
          <kbd>F</kbd> fold · <kbd>C</kbd> check/call · <kbd>R</kbd> raise · <kbd>A</kbd> all-in ·{' '}
          <kbd>←</kbd>/<kbd>→</kbd> size · <kbd>H</kbd> hint · <kbd>N</kbd> next hand.
        </li>
      </ul>
    </>
  );
}
