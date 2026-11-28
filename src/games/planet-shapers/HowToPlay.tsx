import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Subid entre todos el calor (10 pasos), el aire (8) y los mares (7) de Kepra. Cada paso que
          subes te da 1 de calificación (TR), que es ingreso en cada generación y punto al final.
          Tras la generación en la que el planeta queda completo, gana quien tenga más puntos.
        </p>
        <h3>Una generación</h3>
        <ul>
          <li>
            <strong>Investigación</strong>: ves 4 cartas y compras las que quieras por 3 cada una
            (en la primera generación: eliges corporación y ves 10).
          </li>
          <li>
            <strong>Acciones</strong>, una por turno hasta que todos pasan: jugar una carta (pagando
            su coste; el mineral vale 2 en cartas de Obra y el cristal 3 en las Espaciales), un
            proyecto estándar, convertir 8 de flora en una arboleda u 8 de calor en un paso de
            calor, usar la acción de una carta (una vez por generación), vender una carta por 1,
            reclamar un hito (8) o financiar un premio (8, 14, 20).
          </li>
          <li>
            <strong>Producción</strong>: la energía se vuelve calor; ganas tu producción y tantos
            créditos como tu TR más tu producción de créditos.
          </li>
        </ul>
        <h3>Losetas</h3>
        <p>
          Los mares van en las cuencas; las arboledas, junto a tus losetas si puedes (y suben el
          aire); los asentamientos, sin tocar otro asentamiento. Ganas la bonificación impresa y 2
          créditos por cada mar vecino. El calor da producción de calor en los pasos 3 y 6 y un mar
          en el 8; el aire en el paso 5 sube el calor.
        </p>
        <h3>Puntos</h3>
        <p>
          TR, 5 por hito, premios (5 al primero; 2 al segundo con 3 o más jugadores), 1 por
          arboleda, 1 por cada arboleda junto a tus asentamientos y los puntos de las cartas.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Together you raise Kepra’s heat (10 steps), air (8) and seas (7). Every step you raise gives
        you 1 shaping rating (TR), which is income each generation and a point at the end. After the
        generation in which the planet is complete, the most points win.
      </p>
      <h3>A generation</h3>
      <ul>
        <li>
          <strong>Research</strong>: see 4 cards and buy any for 3 each (in the first generation:
          choose a corporation and see 10).
        </li>
        <li>
          <strong>Actions</strong>, one per turn until everyone passes: play a card (paying its
          cost; ore is worth 2 on Build cards and crystal 3 on Space cards), a standard project,
          turn 8 flora into a grove or 8 heat into a heat step, use a card’s action (once per
          generation), sell a card for 1, claim a milestone (8) or fund an award (8, 14, 20).
        </li>
        <li>
          <strong>Production</strong>: power turns into heat; you gain your production and credits
          equal to your TR plus your credit production.
        </li>
      </ul>
      <h3>Tiles</h3>
      <p>
        Seas go in basins; groves next to your tiles if you can (they raise air); settlements not
        touching another settlement. You gain the printed bonus and 2 credits per neighbouring sea.
        Heat gives heat production at steps 3 and 6 and a sea at 8; air at step 5 raises heat.
      </p>
      <h3>Points</h3>
      <p>
        TR, 5 per milestone, awards (5 for first; 2 for second with 3+ players), 1 per grove, 1 per
        grove next to each of your settlements, and the points on cards.
      </p>
    </>
  );
}
