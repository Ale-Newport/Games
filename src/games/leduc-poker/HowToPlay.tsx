import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Dejar al rival sin fichas. Un póker de investigación algo mayor que el de Kuhn: seis
          cartas, una carta pública y dos rondas de apuestas. Solo fichas de juego.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>
            La baraja tiene dos <strong>jotas</strong>, dos <strong>damas</strong> y dos{' '}
            <strong>reyes</strong>. Cada uno pone 1 ficha de ante y recibe una carta tapada.
          </li>
          <li>
            Primera ronda: apuestas y subidas de <strong>2</strong>. Quien habla primero (se alterna
            cada mano) pasa o apuesta; ante una apuesta se puede retirar, igualar o subir; ante una
            subida, retirarse o igualar. Como mucho una apuesta y una subida por ronda.
          </li>
          <li>
            Se destapa la <strong>carta pública</strong> y hay otra ronda igual con apuestas de{' '}
            <strong>4</strong>.
          </li>
          <li>
            En el enfrentamiento gana quien empareja la carta pública; si nadie, la carta más alta.
            Con el mismo rango se reparte el bote.
          </li>
          <li>
            Ambos empiezan con 50 fichas; quien ya no puede cubrir una mano (13 fichas) pierde.
          </li>
        </ul>
        <h3>La IA</h3>
        <p>
          «Nash» juega un equilibrio calculado de antemano con el algoritmo CFR+. «Ver Nash» muestra
          con qué frecuencia elegiría cada jugada en tu lugar, y al final de cada mano verás qué
          probabilidad dio su estrategia a lo que hizo.
        </p>
        <h3>Controles</h3>
        <p>
          Botones o <kbd>C</kbd> pasar/igualar · <kbd>B</kbd> apostar · <kbd>R</kbd> subir ·{' '}
          <kbd>F</kbd> retirarse · <kbd>H</kbd> entrenador Nash · <kbd>N</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Take all your opponent&apos;s chips. A research poker a little bigger than Kuhn: six cards,
        one public card and two betting rounds. Play chips only.
      </p>
      <h3>A hand</h3>
      <ul>
        <li>
          The deck has two <strong>jacks</strong>, two <strong>queens</strong> and two{' '}
          <strong>kings</strong>. Each player antes 1 chip and gets one card face down.
        </li>
        <li>
          Round one: bets and raises of <strong>2</strong>. The first player (alternating every
          hand) checks or bets; facing a bet you may fold, call or raise; facing a raise, fold or
          call. At most one bet and one raise a round.
        </li>
        <li>
          The <strong>public card</strong> is turned up and a second round follows with bets of{' '}
          <strong>4</strong>.
        </li>
        <li>
          At the showdown a card that pairs the public card wins; otherwise the higher card. Equal
          ranks split the pot.
        </li>
        <li>Both start with 50 chips; whoever can no longer cover a hand (13 chips) loses.</li>
      </ul>
      <h3>The AI</h3>
      <p>
        &quot;Nash&quot; plays an equilibrium computed in advance with the CFR+ algorithm.
        &quot;Show Nash&quot; shows how often it would make each move in your place, and after every
        hand you see the probability its strategy gave to what it did.
      </p>
      <h3>Controls</h3>
      <p>
        Buttons or <kbd>C</kbd> check/call · <kbd>B</kbd> bet · <kbd>R</kbd> raise · <kbd>F</kbd>{' '}
        fold · <kbd>H</kbd> Nash coach · <kbd>N</kbd> next hand.
      </p>
    </>
  );
}
