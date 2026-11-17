import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Adivinar dónde y cuándo transcurre cada escena callejera: cinco rondas, hasta 10 000
          puntos cada una.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Arrastra la escena (o usa las flechas) para mirar a tu alrededor en 360°.</li>
          <li>
            Pistas: la arquitectura, los monumentos lejanos, el paisaje y el clima, la escritura de
            los rótulos, una bandera, y la época de coches, farolas, ropa y antenas.
          </li>
          <li>
            Haz clic en el mapa para poner tu marca (acerca con + o la rueda y arrastra para
            moverte) y elige el año entre 1850 y 2025.
          </li>
          <li>
            Hasta 5000 puntos por el lugar (bajan con la distancia) y 5000 por el año (bajan con los
            años de diferencia).
          </li>
          <li>
            Con reloj, al acabarse el tiempo cuenta lo que hayas puesto (sin marca, el lugar puntúa
            0).
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Guess where and when each street scene takes place: five rounds, up to 10,000 points each.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>Drag the scene (or use the arrow keys) to look around in 360°.</li>
        <li>
          Clues: the architecture, distant landmarks, terrain and climate, the script on the signs,
          a flag, and the era of the cars, lamps, clothes and roof antennas.
        </li>
        <li>
          Click the map to drop your pin (zoom with + or the wheel, drag to pan) and pick the year
          between 1850 and 2025.
        </li>
        <li>
          Up to 5,000 points for the place (falling with distance) and 5,000 for the year (falling
          with the years off).
        </li>
        <li>
          With a clock, when time runs out whatever you set counts (no pin scores 0 for the place).
        </li>
      </ul>
    </>
  );
}
