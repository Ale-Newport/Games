import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Reunir <strong>más semillas</strong> en tu almacén.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Siete casas por jugador con siete semillas cada una, y un almacén a la derecha de cada
            uno. Empieza Sur.
          </li>
          <li>
            Siembra en sentido antihorario por tus casas, tu almacén y las casas del rival (nunca su
            almacén).
          </li>
          <li>
            Si la última semilla cae en una casa que ya tenía semillas, tómalas todas y sigue
            sembrando desde ahí.
          </li>
          <li>
            Si cae en tu almacén vuelves a jugar; si cae en una casa vacía tuya, capturas las
            semillas de enfrente.
          </li>
          <li>
            Cuando una fila se queda vacía, cada uno se queda lo de su lado. Gana quien tenga más.
          </li>
          <li>
            Aviso: por la siembra encadenada, quien abre parte con mucha ventaja; las rondas
            alternan quién empieza.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una de tus casillas con semillas (resaltadas) para sembrar.</li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> elegir casilla, <kbd>Intro</kbd> sembrar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Collect <strong>the most seeds</strong> in your store.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Seven houses per player with seven seeds each, and a store at each player’s right. South
          starts.
        </li>
        <li>
          Sow counter-clockwise through your houses, your store and your opponent’s houses (never
          their store).
        </li>
        <li>
          If the last seed lands in a house that already had seeds, pick them all up and keep sowing
          from there.
        </li>
        <li>
          End in your store to go again; end in an empty house of yours to capture the seeds
          opposite.
        </li>
        <li>
          When either row is empty each player keeps the seeds on their side. Most seeds wins.
        </li>
        <li>Note: with relay sowing whoever opens has a big edge; rounds alternate who starts.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of your pits with seeds (highlighted) to sow it.</li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> choose a pit, <kbd>Enter</kbd> sow · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
