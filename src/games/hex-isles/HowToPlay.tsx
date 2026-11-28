import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sé el primero en llegar a 10 puntos en tu propio turno.</p>
        <h3>La isla</h3>
        <p>
          19 hexágonos al azar: arboledas (madera), arrecifes (coral), salinas (sal), lagunas
          (pescado), acantilados (hierro) y unas dunas que no producen. Cada uno tiene un número del
          2 al 12; los puntos bajo el número muestran lo probable que es (el 6 y el 8, en rojo, son
          los más frecuentes y nunca están juntos). Nueve puertos en la costa.
        </p>
        <h3>Preparación</h3>
        <p>
          Por orden, y luego en orden inverso, cada jugador coloca una choza en una esquina y un
          camino desde ella. Nunca puede haber dos edificios en esquinas vecinas. La segunda choza
          da una carta de cada hexágono que toca.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>
            Tira dos dados. Cada hexágono con ese número da 1 carta a cada choza y 2 a cada pueblo
            de sus esquinas (salvo el que tiene la tormenta). Si la banca no tiene suficientes
            cartas de un recurso, nadie lo recibe, salvo que solo lo pida un jugador.
          </li>
          <li>
            Con un 7: quien tenga más de 7 cartas descarta la mitad (redondeando hacia abajo); luego
            mueves la tormenta a otro hexágono y robas una carta al azar a un jugador con un
            edificio en él.
          </li>
          <li>
            Después construye, comercia y juega como mucho una carta de navegación, en el orden que
            quieras, y termina el turno.
          </li>
        </ul>
        <h3>Construir</h3>
        <ul>
          <li>Camino (madera + coral): unido a tu red; un edificio rival la corta.</li>
          <li>Choza (madera + coral + sal + pescado): 1 punto, en una esquina con tu camino.</li>
          <li>Pueblo (2 pescado + 3 hierro): mejora una choza; 2 puntos y produce el doble.</li>
          <li>Carta de navegación (sal + pescado + hierro).</li>
        </ul>
        <p>Tienes 15 caminos, 5 chozas y 4 pueblos.</p>
        <h3>Cartas de navegación</h3>
        <p>
          14 capitanes (mueven la tormenta y roban una carta; se pueden jugar antes de tirar), 2
          obras (dos caminos gratis), 2 botines (dos cartas de la banca), 2 embargos (todos te dan
          un recurso que nombres) y 5 reliquias (1 punto oculto). Una carta comprada no se puede
          jugar en el mismo turno.
        </p>
        <h3>Comercio</h3>
        <p>
          Con la banca, 4 cartas iguales por 1; con un puerto 3:1 o el puerto 2:1 de ese recurso,
          menos. A otro jugador puedes ofrecerle un intercambio (hasta tres ofertas por turno):
          acepta o rechaza.
        </p>
        <h3>Premios</h3>
        <p>
          Ruta más larga (al menos 5 caminos seguidos) y gran flota (al menos 3 capitanes jugados):
          2 puntos cada uno, mientras nadie te supere.
        </p>
        <h3>Controles</h3>
        <p>
          Ratón o toque en las esquinas, aristas y hexágonos resaltados; <kbd>Tab</kbd> e{' '}
          <kbd>Intro</kbd> con el teclado. <kbd>R</kbd> tirar · <kbd>E</kbd> terminar turno ·{' '}
          <kbd>H</kbd> pista · <kbd>Esc</kbd> cancelar.
        </p>
        <p>
          Por seguridad, si una partida llega a 250 rondas, gana quien tenga más puntos (en la
          práctica las partidas duran unas 20).
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to reach 10 points on your own turn.</p>
      <h3>The island</h3>
      <p>
        19 random hexes: groves (wood), reefs (coral), salt pans (salt), lagoons (fish), iron cliffs
        (iron) and one dune field that yields nothing. Each has a number from 2 to 12; the dots
        under it show how likely it is (the red 6 and 8 come up most and are never side by side).
        Nine harbours on the coast.
      </p>
      <h3>Setup</h3>
      <p>
        In order, then in reverse order, each player places a hut on a corner and a path from it.
        Two buildings may never stand on neighbouring corners. The second hut gives one card from
        each hex it touches.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>
          Roll two dice. Every hex with that number pays 1 card to each hut and 2 to each town on
          its corners (except the hex under the storm). If the bank cannot pay everyone a resource,
          nobody gets it — unless only one player is owed it.
        </li>
        <li>
          On a 7: everyone holding more than 7 cards discards half (rounded down); then you move the
          storm to another hex and take a random card from a player with a building on it.
        </li>
        <li>Then build, trade and play at most one sea chart, in any order, and end your turn.</li>
      </ul>
      <h3>Building</h3>
      <ul>
        <li>Path (wood + coral): joined to your network; a rival’s building cuts it.</li>
        <li>Hut (wood + coral + salt + fish): 1 point, on a corner your path reaches.</li>
        <li>Town (2 fish + 3 iron): upgrades a hut; 2 points and double the cards.</li>
        <li>Sea chart (salt + fish + iron).</li>
      </ul>
      <p>You have 15 paths, 5 huts and 4 towns.</p>
      <h3>Sea charts</h3>
      <p>
        14 captains (move the storm and take a card; may be played before rolling), 2 road works
        (two free paths), 2 bounties (two cards from the bank), 2 embargoes (everyone gives you all
        of a resource you name) and 5 relics (1 hidden point). A chart bought this turn cannot be
        played until your next.
      </p>
      <h3>Trading</h3>
      <p>
        With the bank, 4 of a kind for 1; less with a 3:1 harbour or that resource’s 2:1 harbour.
        You may offer another player a trade (up to three offers a turn): they accept or refuse.
      </p>
      <h3>Awards</h3>
      <p>
        Longest trail (5 or more paths in a row) and grand fleet (3 or more captains played): 2
        points each, while nobody beats you.
      </p>
      <h3>Controls</h3>
      <p>
        Mouse or touch on the highlighted corners, edges and hexes; <kbd>Tab</kbd> and{' '}
        <kbd>Enter</kbd> from the keyboard. <kbd>R</kbd> roll · <kbd>E</kbd> end turn · <kbd>H</kbd>{' '}
        hint · <kbd>Esc</kbd> cancel.
      </p>
      <p>
        As a safety limit, a game that reaches 250 rounds is won by the most points (real games take
        about 20).
      </p>
    </>
  );
}
