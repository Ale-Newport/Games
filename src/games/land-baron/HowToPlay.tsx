import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser el último jugador sin quebrar, o, en una partida con tiempo, el más rico (dinero,
          propiedades a su precio —la mitad si están hipotecadas— y edificios) al acabar las rondas.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>
            Tira dos dados y avanza. Al pasar o caer en la Salida cobras 200. Con dobles vuelves a
            tirar; a los terceros dobles, al calabozo.
          </li>
          <li>
            Si caes en un solar, ferri o taller sin dueño, cómpralo a su precio o se subasta entre
            todos (empieza en 0).
          </li>
          <li>
            Si tiene dueño, pagas alquiler: el de un solar se duplica si su dueño tiene el barrio
            entero sin edificar; los ferris cobran 25, 50, 100 o 200 según cuántos tenga el dueño;
            los talleres, 4 veces los dados (10 con los dos).
          </li>
          <li>
            Suerte y Concejo: cartas que mueven, cobran o pagan. Los impuestos se pagan a la banca.
          </li>
          <li>
            Antes de terminar puedes edificar, hipotecar, levantar hipotecas y proponer tratos (dos
            por turno).
          </li>
        </ul>
        <h3>Edificar</h3>
        <p>
          Con un barrio entero y sin hipotecas, edifica casas de una en una y de forma pareja; tras
          cuatro casas, un hotel. La banca tiene 32 casas y 12 hoteles. Los edificios se venden por
          la mitad de su coste.
        </p>
        <h3>Hipotecas y deudas</h3>
        <p>
          Una propiedad sin edificios en su barrio se hipoteca por la mitad de su precio (no cobra
          alquiler) y se recupera pagando esa mitad más un 10 %. Si debes más de lo que tienes,
          vende edificios o hipoteca hasta pagar; si ni así llegas, quiebras y todo pasa al acreedor
          (o vuelve a la banca).
        </p>
        <h3>Calabozo</h3>
        <p>
          Sales pagando 50, con una carta de indulto o sacando dobles; al tercer intento fallido
          pagas 50 y avanzas.
        </p>
        <h3>Controles</h3>
        <p>
          Botones del panel; haz clic en una casilla para ver sus datos y gestionarla. <kbd>R</kbd>{' '}
          tirar · <kbd>B</kbd> comprar · <kbd>A</kbd> subasta · <kbd>E</kbd> terminar turno ·{' '}
          <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the last player not bankrupt — or, in a timed game, the richest (cash, property at its
        price, half when mortgaged, and buildings) when the rounds run out.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>
          Roll two dice and move. Passing or landing on Start pays 200. Doubles roll again; a third
          double sends you to the Lockup.
        </li>
        <li>
          Land on an unowned lot, ferry or works and buy it at its price — or it is auctioned among
          everyone, from 0.
        </li>
        <li>
          If it is owned you pay rent: a lot's rent doubles when its owner holds the whole unbuilt
          district; ferries charge 25, 50, 100 or 200 by how many the owner has; works 4 times the
          dice (10 with both).
        </li>
        <li>Luck and Council: cards that move, pay or charge. Taxes go to the bank.</li>
        <li>
          Before ending your turn you may build, mortgage, redeem and propose trades (two a turn).
        </li>
      </ul>
      <h3>Building</h3>
      <p>
        With a whole district and no mortgages, build houses one at a time and evenly; after four
        houses, a hotel. The bank has 32 houses and 12 hotels. Buildings sell back for half their
        cost.
      </p>
      <h3>Mortgages and debts</h3>
      <p>
        Property with no buildings in its district mortgages for half its price (it earns no rent)
        and is redeemed for that half plus 10 %. If you owe more than you have, sell buildings or
        mortgage until you can pay; if even that is not enough, you are bankrupt and everything goes
        to the creditor (or back to the bank).
      </p>
      <h3>Lockup</h3>
      <p>
        Leave by paying 50, with a pardon card or by rolling doubles; on the third failed roll you
        pay 50 and move.
      </p>
      <h3>Controls</h3>
      <p>
        The panel's buttons; click a space to see its details and manage it. <kbd>R</kbd> roll ·{' '}
        <kbd>B</kbd> buy · <kbd>A</kbd> auction · <kbd>E</kbd> end turn · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
