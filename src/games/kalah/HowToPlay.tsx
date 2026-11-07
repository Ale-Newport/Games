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
            Seis casillas por jugador con cuatro semillas cada una, y un almacén a la derecha de
            cada uno. Empieza Sur.
          </li>
          <li>
            Toma todas las semillas de una de tus casillas y siémbralas una a una en sentido
            antihorario: por tus casillas, tu almacén y las casillas del rival (nunca su almacén).
          </li>
          <li>Si la última semilla cae en tu almacén, vuelves a jugar.</li>
          <li>
            Si cae en una casilla tuya que estaba vacía y la de enfrente tiene semillas, capturas
            ambas y van a tu almacén.
          </li>
          <li>
            Cuando una fila se queda vacía, la partida acaba: cada uno se queda las semillas de su
            lado. Gana quien tenga más.
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
          Six pits per player with four seeds each, and a store at each player’s right. South
          starts.
        </li>
        <li>
          Pick up every seed of one of your pits and sow them one by one counter-clockwise: through
          your pits, your store and your opponent’s pits (never their store).
        </li>
        <li>If the last seed lands in your store, you go again.</li>
        <li>
          If it lands in an empty pit of yours and the pit opposite has seeds, you capture both into
          your store.
        </li>
        <li>
          When either row is empty the game ends and each player keeps the seeds on their side. Most
          seeds wins.
        </li>
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
