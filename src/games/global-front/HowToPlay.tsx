import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tu alianza (dos potencias) debe tener 9 de las 12 ciudades de la victoria al acabar una
          ronda. Tras 15 rondas gana quien tenga más ciudades (y, si empatan, más ingresos).
        </p>
        <h3>Turno de cada potencia (Varn, Kelt, Osia, Tamar)</h3>
        <ul>
          <li>
            <strong>Compra</strong> unidades con su tesoro (no puede comprar si su capital está en
            manos enemigas).
          </li>
          <li>
            <strong>Ataques</strong>: tierra por territorio amigo hasta un territorio enemigo
            (blindados, 2 pasos); aviones dentro de su alcance si después pueden aterrizar en tierra
            amiga; barcos de guerra por mar abierto contra flotas enemigas; transportes que llevan
            hasta dos unidades de tierra de una costa a otra por aguas sin buques enemigos.
          </li>
          <li>
            <strong>Batallas</strong>: cada unidad tira un dado por ronda e impacta con su ataque (o
            defensa) o menos. La artillería sube una infantería a 2. Caen primero las unidades más
            baratas; los acorazados aguantan un impacto; los transportes van los últimos y se
            pierden si quedan solos. El atacante puede retirarse tras cada ronda. Si gana con tropas
            de tierra, toma el territorio (el de un aliado se le devuelve). Los aviones vuelven a
            tierra amiga o se pierden.
          </li>
          <li>
            <strong>Movimientos</strong> por territorio y aguas amigas.
          </li>
          <li>
            <strong>Despliegue</strong>: lo comprado aparece en sus fábricas (hasta el valor del
            territorio) y los barcos junto a ellas.
          </li>
          <li>
            <strong>Ingresos</strong>: el valor de sus territorios, mientras conserve la capital.
            Quien toma una capital se queda su tesoro.
          </li>
        </ul>
        <h3>Unidades (coste · ataque · defensa · movimiento)</h3>
        <p>
          Infantería 3·1·2·1 · Artillería 4·2·2·1 · Blindados 6·3·3·2 · Caza 10·3·4·4 · Bombardero
          12·4·1·6 · Transporte 7·0·0·2 · Crucero 10·3·3·2 · Acorazado 20·4·4·2 (dos impactos).
        </p>
        <h3>Controles</h3>
        <p>
          Haz clic en un lugar para ver sus unidades; elige tipo y cantidad y después el destino
          resaltado (o «Por mar»). <kbd>N</kbd> siguiente fase · <kbd>R</kbd> tirar · <kbd>H</kbd>{' '}
          pista · <kbd>Esc</kbd> cancelar.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Your alliance (two powers) must hold 9 of the 12 victory cities at the end of a round. After
        15 rounds the side with more cities (then more income) wins.
      </p>
      <h3>Each power’s turn (Varn, Kelt, Ossia, Tamar)</h3>
      <ul>
        <li>
          <strong>Buy</strong> units with its treasury (not while its capital is in enemy hands).
        </li>
        <li>
          <strong>Combat moves</strong>: land units through friendly ground into one enemy territory
          (armour 2 steps); aircraft within range if they can then land on friendly ground; warships
          through open water into enemy fleets; transports carry up to two land units from one coast
          to another through water clear of enemy ships.
        </li>
        <li>
          <strong>Battles</strong>: every unit rolls a die each round and hits on its attack (or
          defence) or less. Artillery lifts one infantry to 2. The cheapest units fall first;
          battleships shrug off one hit; transports go last and are lost when left alone. The
          attacker may retreat after any round. Winning with land units takes the territory (an
          ally’s is handed back). Aircraft fly home to friendly ground or are lost.
        </li>
        <li>
          <strong>Moves</strong> through friendly ground and water.
        </li>
        <li>
          <strong>Place</strong> what was bought on its factories (up to the territory’s value),
          ships beside them.
        </li>
        <li>
          <strong>Income</strong>: the value of its territories while it holds its capital. Taking a
          capital takes its treasury.
        </li>
      </ul>
      <h3>Units (cost · attack · defence · move)</h3>
      <p>
        Infantry 3·1·2·1 · Artillery 4·2·2·1 · Armour 6·3·3·2 · Fighter 10·3·4·4 · Bomber 12·4·1·6 ·
        Transport 7·0·0·2 · Cruiser 10·3·3·2 · Battleship 20·4·4·2 (two hits).
      </p>
      <h3>Controls</h3>
      <p>
        Click a place to see its units; choose a kind and how many, then the highlighted destination
        (or “By sea”). <kbd>N</kbd> next phase · <kbd>R</kbd> roll · <kbd>H</kbd> hint ·{' '}
        <kbd>Esc</kbd> cancel.
      </p>
    </>
  );
}
