import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tener la granja que más puntúe tras 12 rondas: campos, pastos, cereal, hortalizas, ovejas,
          cerdos y vacas (−1 si no tienes nada de algo), 3 por miembro de la familia, habitaciones
          de arcilla (+1) o piedra (+2), establos vallados (+1), mejoras; −1 por cada casilla vacía
          y −3 por cada comida que no pudiste dar.
        </p>
        <h3>Una ronda</h3>
        <ul>
          <li>Se abre un espacio nuevo y los espacios que acumulan bienes reciben más.</li>
          <li>
            Por turnos, cada jugador coloca a un miembro de su familia en un espacio libre y hace lo
            que dice: recoger lo que hay, arar, sembrar (cereal: 3; hortaliza: 2), hornear,
            construir habitaciones junto a otras (5 del material de tu casa + 2 de junco) y establos
            (2 de madera), vallar pastos (4 de madera, 1 menos por lado compartido con otro pasto),
            reformar, comprar mejoras o tener un hijo (necesita habitación libre, salvo el
            crecimiento apresurado).
          </li>
          <li>
            Los animales viven en pastos (2, o 4 con establo), en establos sueltos (1) y en casa
            (1); los que no caben se cocinan si tienes hogar o fogón, o se escapan.
          </li>
        </ul>
        <h3>Cosecha (tras las rondas 3, 6, 8, 10 y 12)</h3>
        <p>
          Cada campo sembrado da 1. Cada miembro come 2 (un recién nacido, 1): se usa la comida y,
          si falta, se convierte automáticamente cereal, hortalizas y animales (con hogar o fogón
          valen más). Lo que falte, mendicidad. Después, cada tipo de animal con 2 o más cría uno si
          cabe.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Have the best-scoring farm after 12 rounds: fields, pastures, grain, vegetables, sheep, pigs
        and cows (−1 for having none of one), 3 per family member, clay (+1) or stone (+2) rooms,
        fenced stables (+1), improvements; −1 for each empty square and −3 for each food you could
        not provide.
      </p>
      <h3>A round</h3>
      <ul>
        <li>A new space opens and the spaces that accumulate goods receive more.</li>
        <li>
          In turn, each player puts a family member on a free space and does what it says: take what
          lies there, plough, sow (grain: 3; vegetables: 2), bake, build rooms next to rooms (5 of
          your house material + 2 reed) and stables (2 timber), fence pastures (4 timber, 1 less per
          side shared with another pasture), renovate, buy improvements or have a child (needs a
          free room, except for hurried growth).
        </li>
        <li>
          Animals live in pastures (2, or 4 with a stable), loose stables (1) and the house (1);
          those that do not fit are cooked if you have a hearth or range, or they run off.
        </li>
      </ul>
      <h3>Harvest (after rounds 3, 6, 8, 10 and 12)</h3>
      <p>
        Each sown field yields 1. Each member eats 2 (a newborn 1): food is used and, if short,
        grain, vegetables and animals are converted automatically (worth more with a hearth or
        range). Whatever is missing becomes begging. Then each kind of animal with 2 or more breeds
        one if it fits.
      </p>
    </>
  );
}
