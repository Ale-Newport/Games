import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tener más monedas al final. La partida acaba cuando alguien gana su quinta estrella (o
          tras 30 turnos cada uno). Entonces se suman tus monedas y, según tu popularidad (0–6,
          7–12, 13–18), 3/4/5 por estrella, 2/3/4 por territorio (la Fundición vale 3) y 1/2/3 por
          cada 2 recursos.
        </p>
        <h3>Tu turno</h3>
        <p>
          Elige una de las cuatro secciones de tu tablero, distinta de la del turno anterior. Haz su
          acción superior y luego, si puedes pagarla, la inferior:
        </p>
        <ul>
          <li>
            <strong>Mover</strong> 2 unidades un espacio (o tomar 1 moneda). Los obreros no entran
            donde hay enemigos; tu personaje o tus robots sí: si hay robots o personaje enemigos,
            hay combate; si solo hay obreros, vuelven a su base y pierdes 1 de popularidad por cada
            uno.
          </li>
          <li>
            <strong>Comerciar</strong>: 1 moneda por 2 recursos o 1 de popularidad.
          </li>
          <li>
            <strong>Producir</strong> en 2 espacios con tus obreros: 1 recurso por obrero (las
            aldeas dan obreros). Con 4, 6 y 8 obreros cuesta además 1 de poder, de popularidad y una
            moneda.
          </li>
          <li>
            <strong>Reforzar</strong>: 1 moneda por 2 de poder.
          </li>
          <li>
            Abajo: <strong>mejorar</strong> (petróleo), <strong>desplegar</strong> un robot (metal),{' '}
            <strong>construir</strong> (madera) o <strong>reclutar</strong> (comida); dan monedas.
          </li>
        </ul>
        <h3>Combate</h3>
        <p>
          Cada bando puja en secreto hasta 7 de poder; se suma 1 por personaje o robot presente (y
          +2 con ciertas habilidades). Gana el mayor; el atacante gana los empates. El perdedor
          vuelve a su base y el ganador gana una estrella (dos como mucho).
        </p>
        <h3>Estrellas</h3>
        <p>
          5 mejoras, 4 robots, 4 edificios, 4 reclutas, 6 obreros, 12 de poder, 14 de popularidad y
          hasta 2 victorias.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Have the most coins at the end. The game ends when someone earns a fifth star (or after 30
        turns each). Then you add your coins and, at your popularity tier (0–6, 7–12, 13–18), 3/4/5
        per star, 2/3/4 per territory (the Foundry counts 3) and 1/2/3 per 2 resources.
      </p>
      <h3>Your turn</h3>
      <p>
        Pick one of the four sections of your board, not last turn’s. Take its top action, then its
        bottom action if you can pay for it:
      </p>
      <ul>
        <li>
          <strong>Move</strong> 2 units one space (or take 1 coin). Workers never enter spaces with
          enemies; your character and mechs may: with enemy mechs or character there you fight; with
          only workers, they go home and you lose 1 popularity for each.
        </li>
        <li>
          <strong>Trade</strong>: 1 coin for 2 resources or 1 popularity.
        </li>
        <li>
          <strong>Produce</strong> on 2 spaces with your workers: 1 resource per worker (villages
          make workers). At 4, 6 and 8 workers it also costs 1 power, 1 popularity and a coin.
        </li>
        <li>
          <strong>Bolster</strong>: 1 coin for 2 power.
        </li>
        <li>
          Bottom: <strong>upgrade</strong> (oil), <strong>deploy</strong> a mech (metal),{' '}
          <strong>build</strong> (wood) or <strong>enlist</strong> (food); they pay coins.
        </li>
      </ul>
      <h3>Fights</h3>
      <p>
        Each side secretly bids up to 7 power; add 1 per character or mech there (and +2 with some
        abilities). The higher total wins; attackers win ties. The loser goes home and the winner
        earns a star (two at most).
      </p>
      <h3>Stars</h3>
      <p>
        5 upgrades, 4 mechs, 4 structures, 4 recruits, 6 workers, 12 power, 14 popularity and up to
        2 victories.
      </p>
    </>
  );
}
