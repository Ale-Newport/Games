import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Alunizar con suavidad en las plataformas tantas veces como te dé el combustible.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La gravedad tira del módulo hacia abajo. Gíralo y enciende el motor para frenar o
            desplazarte.
          </li>
          <li>
            Para alunizar bien, apoya las dos patas en la misma plataforma bajando despacio, con
            poca deriva y casi recto: los instrumentos de arriba se ponen verdes cuando vas bien.
          </li>
          <li>
            Cada plataforma paga 50 × su marca (×5, ×3, ×2), y 50 más si el contacto es muy suave.
          </li>
          <li>
            Cualquier otro contacto es un choque y cuesta 200 de combustible. Cada ronda trae un
            terreno nuevo; la partida acaba al terminar una ronda sin combustible.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> giran · <kbd>↑</kbd> o <kbd>Espacio</kbd> enciende el motor ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia · o el panel táctil.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Touch down gently on the pads as many times as your fuel allows.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Gravity pulls the lander down. Turn it and fire the engine to brake or move sideways.
        </li>
        <li>
          For a safe touchdown, put both feet on the same pad while coming down slowly, drifting
          little and nearly upright: the instruments at the top turn green when you are within
          limits.
        </li>
        <li>Each pad pays 50 × its mark (×5, ×3, ×2), plus 50 for a very soft touchdown.</li>
        <li>
          Any other contact is a crash and costs 200 fuel. Each round brings new ground; the run
          ends when a round finishes with no fuel.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> turn · <kbd>↑</kbd> or <kbd>Space</kbd> fires the engine ·{' '}
        <kbd>P</kbd> pause · <kbd>R</kbd> restart · or the touch pad.
      </p>
    </>
  );
}
