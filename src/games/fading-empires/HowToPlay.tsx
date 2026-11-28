import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tener más monedas al acabar la última ronda (10 con 2 o 3 jugadores, 9 con 4, 8 con 5). Se
          empieza con 5.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>
            <strong>Sin imperio activo</strong>: elige una pareja de pueblo y rasgo de la fila de
            seis. Saltarte una cuesta una moneda, que se queda sobre ella; las monedas de la pareja
            elegida son tuyas. Recibes sus bandas (las del pueblo más las del rasgo).
          </li>
          <li>
            <strong>Con imperio</strong>: avanza (cada región conserva una banda y el resto pasa a
            tu mano; puedes abandonar regiones) o deja que decline.
          </li>
          <li>
            <strong>Conquista</strong>: tomar una región cuesta 2 bandas más las que la defienden
            (una tribu salvaje es una), +1 si es montaña, menos los descuentos de tu pareja (mínimo
            1). La primera región de un imperio nuevo debe estar en el borde del valle; las
            siguientes, junto a las tuyas. Los lagos no se toman.
          </li>
          <li>
            Si te faltan bandas (de una a tres), puedes intentarlo una última vez con el dado de
            refuerzo (0, 0, 0, 1, 2, 3). Gane o pierda, la conquista termina.
          </li>
          <li>
            El defensor activo pierde una banda (dos ante los Despiadados) y las demás pasan a su
            región más débil; un pueblo en declive pierde su banda.
          </li>
          <li>
            <strong>Despliegue</strong>: reparte las bandas que te quedan en tus regiones y cobra: 1
            moneda por región (activas y en declive) más los bonos de tu pareja.
          </li>
        </ul>
        <h3>Declive</h3>
        <p>
          En vez de avanzar, tu imperio puede declinar: queda una banda en cada región, que sigue
          dando monedas; tu anterior pueblo en declive desaparece. El turno siguiente eliges una
          pareja nueva. Los Tenaces pueden declinar al final de un turno de conquista.
        </p>
        <h3>Controles</h3>
        <p>
          Haz clic en las regiones resaltadas (se muestra el coste); en el despliegue, una banda o
          todas por clic. <kbd>M</kbd> avanzar · <kbd>D</kbd> declinar · <kbd>S</kbd> parar ·{' '}
          <kbd>E</kbd> terminar turno · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Have the most coins when the last round ends (10 rounds with 2 or 3 players, 9 with 4, 8
        with 5). Everyone starts with 5.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>
          <strong>No active empire</strong>: pick a people-and-trait pairing from the row of six.
          Skipping one costs a coin, left on it; the coins on the pairing you pick are yours. You
          get its bands (the people’s plus the trait’s).
        </li>
        <li>
          <strong>With an empire</strong>: march on (each region keeps one band, the rest come to
          your hand; you may abandon regions) or let it decline.
        </li>
        <li>
          <strong>Conquest</strong>: taking a region costs 2 bands plus its defenders (a wild tribe
          is one), +1 on a mountain, less your pairing’s discounts (at least 1). A new empire’s
          first region must be on the valley’s edge; later ones next to yours. Lakes cannot be
          taken.
        </li>
        <li>
          When one to three bands short you may try once more with the reinforcement die (0, 0, 0,
          1, 2, 3). Win or lose, the conquest ends.
        </li>
        <li>
          An active defender loses a band (two against the Merciless) and its others move to its
          weakest region; a declined people loses its band.
        </li>
        <li>
          <strong>Redeploy</strong>: spread your remaining bands over your regions and collect: 1
          coin per region (active and declined) plus your pairing’s bonuses.
        </li>
      </ul>
      <h3>Decline</h3>
      <p>
        Instead of marching, your empire may decline: one band stays on each region, still earning
        coins; your older declined people leaves. Next turn you pick a new pairing. The Stalwart may
        decline at the end of a turn of conquest.
      </p>
      <h3>Controls</h3>
      <p>
        Click highlighted regions (their cost is shown); when redeploying, one band or all per
        click. <kbd>M</kbd> march · <kbd>D</kbd> decline · <kbd>S</kbd> stop · <kbd>E</kbd> end turn
        · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
