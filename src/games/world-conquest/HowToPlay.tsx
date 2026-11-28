import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Conquista los 36 territorios: gana el último jugador que quede en pie.</p>
        <h3>Preparación</h3>
        <p>
          Los territorios se reparten al azar. Cada jugador recibe 40 ejércitos con 2 jugadores, 35
          con 3, 30 con 4 y 25 con 5; uno va a cada territorio suyo y el resto se coloca por turnos,
          de tres en tres.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>
            <strong>Refuerzos</strong>: un tercio de tus territorios (mínimo 3), más el bono de cada
            continente que domines entero, más los tríos de cartas que cambies. Con cinco cartas o
            más, debes cambiar un trío.
          </li>
          <li>
            <strong>Ataques</strong>, tantos como quieras: desde un territorio con al menos 2
            ejércitos a un vecino enemigo (las líneas discontinuas son rutas marítimas). Tiras hasta
            3 dados (uno menos que tus ejércitos) y el defensor hasta 2; se comparan los más altos y
            los empates los gana el defensor. Cada pareja perdida cuesta un ejército.
          </li>
          <li>
            Si dejas un territorio sin defensores, lo ocupas con al menos tantos ejércitos como
            dados tiraste.
          </li>
          <li>
            <strong>Refuerzo final</strong>: un movimiento de ejércitos entre dos territorios tuyos
            vecinos (siempre queda uno atrás).
          </li>
        </ul>
        <h3>Cartas</h3>
        <p>
          Si conquistas algo en tu turno, ganas una carta (escudo, caballo o cañón con un
          territorio, o comodín). Tres iguales, una de cada o dos más un comodín forman un trío: los
          tríos dan 4, 6, 8, 10, 12 y 15 ejércitos, y luego 5 más cada vez. Si una carta muestra un
          territorio tuyo, pones allí 2 ejércitos más. Quien elimina a un jugador se queda sus
          cartas (y con 6 o más debe cambiar en el acto).
        </p>
        <h3>Continentes</h3>
        <p>
          Marca Helada +3, Estepas de Hierro +5, Costa Verde +3, Reinos Hundidos +4, Páramo
          Ceniciento +3, Islas de Coral +3.
        </p>
        <h3>Controles</h3>
        <p>
          Haz clic o toca tus territorios resaltados; en el ataque, primero el tuyo y después el
          enemigo. <kbd>Tab</kbd> e <kbd>Intro</kbd> con el teclado. <kbd>E</kbd> terminar ataques o
          turno · <kbd>H</kbd> pista · <kbd>Esc</kbd> cancelar.
        </p>
        <p>
          Por seguridad, a las 300 rondas gana quien tenga más territorios (las partidas reales
          terminan mucho antes).
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Conquer all 36 territories: the last player standing wins.</p>
      <h3>Setup</h3>
      <p>
        Territories are dealt at random. Each player has 40 armies with 2 players, 35 with 3, 30
        with 4 and 25 with 5; one goes on each of their territories and the rest are placed in
        turns, three at a time.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>
          <strong>Reinforce</strong>: a third of your territories (at least 3), plus the bonus of
          every landmass you hold whole, plus any card sets you trade. With five cards or more you
          must trade a set.
        </li>
        <li>
          <strong>Attack</strong> as often as you like: from a territory with at least 2 armies into
          an enemy neighbour (dashed lines are sea lanes). You roll up to 3 dice (one fewer than
          your armies), the defender up to 2; highest dice are compared and ties go to the defender.
          Each lost pair costs one army.
        </li>
        <li>Empty a territory and you move in with at least as many armies as dice you rolled.</li>
        <li>
          <strong>Fortify</strong>: one move of armies between two neighbouring territories of yours
          (one always stays behind).
        </li>
      </ul>
      <h3>Cards</h3>
      <p>
        Conquer anything in your turn and you earn a card (shield, horse or cannon with a territory,
        or a wild). Three alike, one of each, or any two with a wild make a set: sets give 4, 6, 8,
        10, 12 and 15 armies, then 5 more each time. If a card shows a territory you hold, 2 extra
        armies go there. Knocking a player out takes their cards (and with 6 or more you must trade
        at once).
      </p>
      <h3>Landmasses</h3>
      <p>
        Frostmark +3, Iron Steppes +5, Verdant Coast +3, Sunken Kingdoms +4, Ashen Waste +3, Coral
        Isles +3.
      </p>
      <h3>Controls</h3>
      <p>
        Click or tap your highlighted territories; to attack, yours first and then the enemy.{' '}
        <kbd>Tab</kbd> and <kbd>Enter</kbd> from the keyboard. <kbd>E</kbd> end attacks or turn ·{' '}
        <kbd>H</kbd> hint · <kbd>Esc</kbd> cancel.
      </p>
      <p>
        As a safety limit, after 300 rounds the most territories win (real games end long before).
      </p>
    </>
  );
}
