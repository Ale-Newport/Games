import type { Locale } from '../../../core/i18n';
import type { PokerVariant } from './engine';

/** Rules for the poker games; the Omaha differences are spelled out where they apply. */
export function PokerRules({ locale, variant }: { locale: Locale; variant: PokerVariant }) {
  if (variant.id === 'draw') return <DrawRules locale={locale} />;
  if (variant.id === 'stud') return <StudRules locale={locale} />;
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

function DrawRules({ locale }: { locale: Locale }) {
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
            El botón (D) avanza cada mano; los dos jugadores a su izquierda ponen la{' '}
            <strong>ciega pequeña</strong> y la <strong>ciega grande</strong>.
          </li>
          <li>
            Cada jugador recibe <strong>cinco cartas tapadas</strong> y hay una ronda de apuestas.
          </li>
          <li>
            <strong>Descarte</strong>: empezando a la izquierda del botón, cada jugador que sigue en
            la mano tira <strong>hasta tres cartas</strong> y recibe otras tantas (o se queda{' '}
            <em>servido</em>). Todos ven cuántas cartas cambió cada uno.
          </li>
          <li>Otra ronda de apuestas y, si quedan varios, enfrentamiento: gana la mejor mano.</li>
          <li>
            <strong>Límite fijo</strong>: antes del descarte se apuesta y se sube de una ciega
            grande en una; después, de dos en dos. Como mucho cuatro apuestas por ronda (la apuesta
            y tres subidas).
          </li>
          <li>
            Quien va con todo con menos fichas solo opta al bote que pudo cubrir; el resto va a
            botes laterales.
          </li>
        </ul>
        <h3>Manos, de mejor a peor</h3>
        <p>
          Escalera de color · póker · full · color · escalera (A-2-3-4-5 vale) · trío · doble pareja
          · pareja · carta alta.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>
            Botones para retirarte, pasar o igualar y subir. En el descarte toca las cartas que
            quieres cambiar (se levantan) y pulsa «Cambiar» o «Servido». «Pista» te aconseja.
          </li>
          <li>
            <kbd>F</kbd> retirarse · <kbd>C</kbd> pasar/igualar · <kbd>R</kbd> subir · <kbd>1</kbd>–
            <kbd>5</kbd> elegir cartas · <kbd>D</kbd> cambiar · <kbd>H</kbd> pista · <kbd>N</kbd>{' '}
            siguiente mano.
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
          The button (D) moves round each hand; the two players to its left post the{' '}
          <strong>small blind</strong> and the <strong>big blind</strong>.
        </li>
        <li>
          Everyone is dealt <strong>five cards face down</strong>, then there is a betting round.
        </li>
        <li>
          <strong>The draw</strong>: starting left of the button, every player still in throws away{' '}
          <strong>up to three cards</strong> and is dealt as many (or <em>stands pat</em>). Everyone
          sees how many cards each player took.
        </li>
        <li>Another betting round, then a showdown if more than one player is left.</li>
        <li>
          <strong>Fixed limit</strong>: before the draw bets and raises are one big blind each;
          after it, two. At most four bets a round (a bet and three raises).
        </li>
        <li>
          A player all-in for less can only win what they covered; the rest goes to side pots.
        </li>
      </ul>
      <h3>Hands, best first</h3>
      <p>
        Straight flush · four of a kind · full house · flush · straight (A-2-3-4-5 counts) · three
        of a kind · two pair · pair · high card.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>
          Buttons to fold, check or call, and raise. In the draw, tap the cards to throw away (they
          lift) and press Draw or Stand pat. "Hint" gives advice.
        </li>
        <li>
          <kbd>F</kbd> fold · <kbd>C</kbd> check/call · <kbd>R</kbd> raise · <kbd>1</kbd>–
          <kbd>5</kbd> pick cards · <kbd>D</kbd> draw · <kbd>H</kbd> hint · <kbd>N</kbd> next hand.
        </li>
      </ul>
    </>
  );
}

function StudRules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Quedarte con todas las fichas de la mesa en un torneo: todos empiezan con 1500 y las
          apuestas suben cada diez manos. Solo fichas de juego, nunca dinero real.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>
            Todos ponen un <strong>ante</strong> y reciben dos cartas tapadas y una destapada
            (tercera calle). Quien muestra la carta destapada más baja pone la{' '}
            <strong>entrada</strong> obligatoria (con empate de rango, decide el palo: tréboles,
            diamantes, corazones, picas).
          </li>
          <li>
            Empezando a su izquierda, cada jugador iguala la entrada, la <strong>completa</strong> a
            una apuesta pequeña o se retira.
          </li>
          <li>
            Cuarta, quinta y sexta calle: una carta destapada más; séptima: una tapada. Desde la
            cuarta calle abre la apuesta quien muestra la mejor jugada visible.
          </li>
          <li>
            <strong>Límite fijo</strong>: apuestas pequeñas en tercera y cuarta calle y dobles desde
            la quinta; como mucho cuatro apuestas por calle.
          </li>
          <li>
            En el enfrentamiento gana la mejor jugada de cinco cartas entre las siete de cada
            jugador. Hay botes laterales para quien va con todo con menos fichas.
          </li>
        </ul>
        <h3>Manos, de mejor a peor</h3>
        <p>
          Escalera de color · póker · full · color · escalera (A-2-3-4-5 vale) · trío · doble pareja
          · pareja · carta alta.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>
            Botones para retirarte, pasar o igualar y apostar, completar o subir. Tus cartas tapadas
            se ven un poco más abajo y oscuras: los rivales no las ven. «Pista» estima tus opciones.
          </li>
          <li>
            <kbd>F</kbd> retirarse · <kbd>C</kbd> pasar/igualar · <kbd>R</kbd> apostar/subir ·{' '}
            <kbd>H</kbd> pista · <kbd>N</kbd> siguiente mano.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Win every chip at the table in a sit-and-go: everyone starts with 1500 and the stakes rise
        every ten hands. Play chips only, never real money.
      </p>
      <h3>A hand</h3>
      <ul>
        <li>
          Everyone posts an <strong>ante</strong> and gets two cards face down and one face up
          (third street). The lowest up card posts the forced <strong>bring-in</strong> (ties of
          rank go by suit: clubs, diamonds, hearts, spades).
        </li>
        <li>
          Starting on its left, each player calls the bring-in, <strong>completes</strong> it to a
          small bet, or folds.
        </li>
        <li>
          Fourth, fifth and sixth street: one more card face up; seventh street: one face down. From
          fourth street on, the best showing hand bets first.
        </li>
        <li>
          <strong>Fixed limit</strong>: small bets on third and fourth street, double from fifth; at
          most four bets a street.
        </li>
        <li>
          At the showdown the best five cards out of each player&apos;s seven win. Side pots cover
          players all-in for less.
        </li>
      </ul>
      <h3>Hands, best first</h3>
      <p>
        Straight flush · four of a kind · full house · flush · straight (A-2-3-4-5 counts) · three
        of a kind · two pair · pair · high card.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>
          Buttons to fold, check or call, and bet, complete or raise. Your face-down cards sit a
          little lower and darker: the others cannot see them. "Hint" estimates your chances.
        </li>
        <li>
          <kbd>F</kbd> fold · <kbd>C</kbd> check/call · <kbd>R</kbd> bet/raise · <kbd>H</kbd> hint ·{' '}
          <kbd>N</kbd> next hand.
        </li>
      </ul>
    </>
  );
}
