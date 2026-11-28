import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llega antes que nadie a la puntuación objetivo (7 o 10). Si nadie llega tras la ronda 8,
          gana quien tenga más puntos (y, si empatan, más planetas).
        </p>
        <h3>La galaxia</h3>
        <p>
          37 sistemas hexagonales en torno al Nexo, repartidos de nuevo en cada partida. Cada
          planeta da recursos (para construir e investigar) e influencia (para votar y algunas
          cartas); al gastarlos se agota hasta la fase de estado. Las nebulosas detienen a las
          naves, las grietas no cuestan movimiento y los campos de asteroides no se pueden cruzar.
          Concord, en el Nexo, está guardado por dos guardianes.
        </p>
        <h3>Una ronda</h3>
        <ul>
          <li>
            <strong>Estrategia</strong>: desde el portavoz, cada uno coge una carta (dos con dos
            jugadores). Las cartas sin dueño acumulan una mercancía. El número de la carta marca el
            orden de juego.
          </li>
          <li>
            <strong>Acciones</strong>, por turnos, una cada vez: <em>activar</em> un sistema (gasta
            una ficha de mando) y mover a él naves de sistemas sin tu ficha y a su alcance (los
            portanaves y acorazados llevan cazas e infantería de donde salen); si hay naves
            enemigas, batalla espacial (cada nave tira un d10 e impacta con su valor o más; el
            atacante puede retirarse tras cada ronda); después desembarca infantería (los acorazados
            bombardean primero; combate terrestre hasta el final) y, si tienes un muelle, construye
            hasta los recursos del planeta + 2. O juega tu carta: su efecto principal, y los demás
            pueden seguir la secundaria (por lo general una ficha y un pago). Cuando hayas jugado
            tus cartas, puedes pasar.
          </li>
          <li>
            <strong>Estado</strong>: cada uno puede puntuar un objetivo público que cumpla (los de
            «gastar» se pagan al puntuar); quien tenga el Nexo gana 1 punto; sale un objetivo nuevo
            (de 2 puntos desde la ronda 4); todos ganan 2 fichas y preparan sus planetas.
          </li>
          <li>
            <strong>Consejo</strong> (cuando alguien ya ha tomado el Nexo): se vota una propuesta.
            Cada voto es la influencia de tus planetas preparados, que quedan agotados para la ronda
            siguiente. Desempata el portavoz.
          </li>
        </ul>
        <h3>Unidades</h3>
        <p>
          Infantería (coste 1, impacta con 8), caza (1, 9), crucero (2, 7, mueve 2), portanaves (3,
          9, mueve 1, lleva 4), acorazado (4, 5, mueve 1, lleva 1, aguanta un impacto y bombardea).
          Máximo 4 naves grandes por sistema y jugador.
        </p>
        <h3>Controles</h3>
        <p>
          Haz clic en un sistema para verlo y activarlo; usa los paneles de la derecha en cada fase.
          Teclas: D hecho · R tirar · P pasar · H pista · Esc quitar selección.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the first to the target score (7 or 10). If nobody gets there by the end of round 8, the
        most points win (then the most planets).
      </p>
      <h3>The galaxy</h3>
      <p>
        37 hex systems around the Nexus, dealt anew each game. Each planet gives resources (to build
        and research) and influence (to vote and for some cards); spending it exhausts the planet
        until the status phase. Nebulae stop ships, rifts cost no movement and asteroid fields
        cannot be crossed. Concord, at the Nexus, is held by two wardens.
      </p>
      <h3>A round</h3>
      <ul>
        <li>
          <strong>Strategy</strong>: from the speaker, everyone takes a card (two each with two
          players). Cards nobody takes gain a trade good. The card’s number sets the turn order.
        </li>
        <li>
          <strong>Actions</strong>, in turn, one at a time: <em>activate</em> a system (spend a
          command token) and move ships into it from systems in range without your token (carriers
          and dreadnoughts bring fighters and infantry from where they leave); if enemy ships are
          there, a space battle (each ship rolls a d10 and hits on its value or more; the attacker
          may retreat after any round); then land infantry (dreadnoughts bombard first; ground
          combat to the end) and, with a dock there, build up to the planet’s resources + 2. Or play
          your card: its primary effect, and the others may follow its secondary (usually a token
          and a payment). Once your cards are played you may pass.
        </li>
        <li>
          <strong>Status</strong>: everyone may score one public objective they meet (“spend” ones
          are paid as you score); whoever holds the Nexus gains 1 point; a new objective comes out
          (worth 2 from round 4); everyone gains 2 tokens and readies their planets.
        </li>
        <li>
          <strong>Council</strong> (once someone has taken the Nexus): one agenda is voted on. Your
          votes are the influence of your ready planets, which stay exhausted into the next round.
          The speaker breaks ties.
        </li>
      </ul>
      <h3>Units</h3>
      <p>
        Infantry (cost 1, hits on 8), fighter (1, 9), cruiser (2, 7, move 2), carrier (3, 9, move 1,
        holds 4), dreadnought (4, 5, move 1, holds 1, soaks one hit and bombards). At most 4 large
        ships per player in a system.
      </p>
      <h3>Controls</h3>
      <p>
        Click a system to inspect and activate it; use the panels on the right in each phase. Keys:
        D done · R roll · P pass · H hint · Esc clear selection.
      </p>
    </>
  );
}
