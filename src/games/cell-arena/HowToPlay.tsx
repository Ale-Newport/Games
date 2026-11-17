import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Hacerte la célula más grande de la placa. Tu puntuación es la mayor masa que alcances.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Tus células van hacia donde apuntas; cuanto más grandes, más lentas.</li>
          <li>
            Una célula se come lo que cubre si tiene al menos un 25 % más de masa: bolitas, masa
            expulsada o células de otros jugadores. Las mayores te comen a ti igual.
          </li>
          <li>
            <strong>Dividir</strong> parte en dos cada célula de 35 o más de masa y lanza la mitad
            hacia delante (hasta 16 células). Tras un tiempo de enfriamiento tus células se vuelven
            a unir.
          </li>
          <li>
            <strong>Expulsar</strong> dispara 13 de masa (te cuesta 16): sirve para alimentar a
            otros o a los virus.
          </li>
          <li>
            Los <strong>virus</strong> verdes esconden a las células pequeñas, pero revientan en
            muchos trozos a la célula grande que se los coma. Si un virus recibe siete disparos de
            masa, lanza un virus nuevo en esa dirección.
          </li>
          <li>Las células muy grandes pierden masa poco a poco.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Ratón para dirigir (sin pulsar) o flechas/WASD · <kbd>Espacio</kbd> dividir · <kbd>X</kbd>
          /<kbd>Mayús</kbd> expulsar masa · en móvil, arrastra y usa los botones · <kbd>P</kbd>{' '}
          pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Become the biggest cell in the dish. Your score is the largest mass you reach.</p>
      <h3>How to play</h3>
      <ul>
        <li>Your cells move where you point; the bigger they are, the slower.</li>
        <li>
          A cell swallows whatever it covers if it has at least 25 % more mass: pellets, ejected
          mass, other players’ cells. Bigger cells eat you the same way.
        </li>
        <li>
          <strong>Split</strong> halves every cell of 35+ mass and fires the half forward (up to 16
          cells). After a cooldown your cells merge back together.
        </li>
        <li>
          <strong>Eject</strong> fires 13 mass (costing you 16): feed others or viruses.
        </li>
        <li>
          Green <strong>viruses</strong> hide small cells but burst any big cell that eats one into
          many pieces. A virus fed seven blobs shoots out a new virus in that direction.
        </li>
        <li>Very big cells slowly lose mass.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Mouse to steer (no press needed) or arrows/WASD · <kbd>Space</kbd> split · <kbd>X</kbd>/
        <kbd>Shift</kbd> eject mass · on phones drag and use the buttons · <kbd>P</kbd> pause ·{' '}
        <kbd>R</kbd> restart.
      </p>
    </>
  );
}
