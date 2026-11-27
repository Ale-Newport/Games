import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Adivina el tamaño real de rascacielos, puentes, barcos, aviones, coches, estatuas,
          planetas, estrellas y más, comparándolos con una referencia dibujada a la misma escala.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Ves el nombre del objeto misterioso, su tipo y la medida que se pregunta (alto, largo,
            diámetro o envergadura). A la izquierda (o arriba) hay una referencia con su tamaño
            real.
          </li>
          <li>
            Estira o encoge el objeto resaltado: arrástralo o arrastra su asa, mueve el deslizador,
            usa la rueda del ratón o las flechas. La vista se aleja o acerca sola para que todo
            quepa. Puedes ir de 1/40 a 40 veces la referencia.
          </li>
          <li>
            «Fijar» revela el tamaño real (contorno discontinuo) y la fuente. La puntuación es
            proporcional: 100 × e^(−1,152 × |ln(estimación/real)|). Exacto da 100; un 10 % de error,
            90; la mitad o el doble, 45; diez veces menos o más, 7.
          </li>
        </ul>
        <h3>Modos</h3>
        <ul>
          <li>
            <b>Diario</b>: cinco objetos conocidos de categorías distintas, los mismos para todos
            ese día (máximo 500).
          </li>
          <li>
            <b>Sin fin</b>: elige dificultad y categoría (edificios y estructuras, vehículos,
            espacio o todo). Fácil: objetos famosos y referencias de tamaño parecido. Normal:
            conocidos, referencia hasta 5 veces distinta. Difícil: todos, hasta 8 veces.
          </li>
          <li>Unidades métricas o imperiales en el menú.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Ratón o dedo para arrastrar; rueda del ratón; con el escenario enfocado, <kbd>↑</kbd>/
          <kbd>→</kbd> agrandan un 2 % y <kbd>↓</kbd>/<kbd>←</kbd> encogen (con <kbd>Mayús</kbd>, un
          10 %); <kbd>Intro</kbd> fija.
        </p>
        <h3>Datos</h3>
        <p>
          5.716 objetos medidos de Wikidata (CC0). Solo se usan valores coherentes: si hay varias
          cifras para el mismo objeto deben coincidir en un 5 % (o se usa la marcada como
          preferente, o la media en planetas), y deben ser plausibles para su tipo. Las alturas de
          edificios son las que registra Wikidata y pueden incluir agujas o antenas. Las referencias
          estándar: persona de 1,75 m, tarjeta de 85,6 mm (ISO/IEC 7810), CD de 120 mm (ECMA-130) y
          campo de fútbol de 105 m.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Guess the real size of skyscrapers, bridges, ships, aircraft, cars, statues, planets, stars
        and more by comparing them with a reference drawn to the same scale.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          You see the mystery object's name, its kind and the dimension asked (height, length,
          diameter or wingspan). On the left (or on top) is a reference with its real size.
        </li>
        <li>
          Stretch or shrink the highlighted object: drag it or its handle, move the slider, use the
          mouse wheel or the arrow keys. The view zooms by itself so everything fits. You can go
          from 1/40 to 40 times the reference.
        </li>
        <li>
          “Lock in” reveals the real size (dashed outline) and its source. Scoring is proportional:
          100 × e^(−1.152 × |ln(guess/actual)|). Exact scores 100; 10 % off, 90; half or double, 45;
          ten times off, 7.
        </li>
      </ul>
      <h3>Modes</h3>
      <ul>
        <li>
          <b>Daily</b>: five well-known objects of different kinds, the same for everyone that day
          (500 max).
        </li>
        <li>
          <b>Endless</b>: pick a difficulty and category (buildings & structures, vehicles, space or
          everything). Easy: famous objects, references close in size. Normal: well-known objects,
          references up to 5× off. Hard: all objects, up to 8×.
        </li>
        <li>Metric or imperial units in the menu.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Mouse or finger to drag; mouse wheel; with the stage focused, <kbd>↑</kbd>/<kbd>→</kbd> grow
        by 2 % and <kbd>↓</kbd>/<kbd>←</kbd> shrink (<kbd>Shift</kbd>: 10 %); <kbd>Enter</kbd> locks
        in.
      </p>
      <h3>Data</h3>
      <p>
        5,716 measured objects from Wikidata (CC0). Only consistent values are used: several figures
        for one object must agree within 5 % (or the preferred one is taken, or the mean radius for
        planets), and must be plausible for the kind of object. Building heights are those Wikidata
        records and may include spires or antennas. Standard references: a 1.75 m adult, an 85.6 mm
        card (ISO/IEC 7810), a 120 mm CD (ECMA-130) and a 105 m football pitch.
      </p>
    </>
  );
}
