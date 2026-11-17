import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Todos contra todos: gana quien llegue antes a las bajas de la partida (15 o 25) o quien
          tenga más cuando se acabe el tiempo (3 o 6 minutos).
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            <strong>Movimiento:</strong> corre, agáchate, deslízate (agáchate mientras corres) y
            salta. Si mantienes el salto, vuelves a saltar al tocar el suelo sin perder velocidad.
            Puedes subir escalones de medio bloque y saltar sobre cajas de un bloque.
          </li>
          <li>
            <strong>Armas:</strong> el fusilero lleva fusil automático (30 balas) y pistola; el
            tirador, francotirador (3 balas, 90 de daño, preciso solo con la mira) y pistola. Los
            disparos a la cabeza hacen un 50–60 % más. Correr, saltar y disparar seguido abren la
            dispersión; apuntar la cierra. Recargas solo al vaciar el cargador o con R.
          </li>
          <li>
            <strong>Vida:</strong> 100. Se regenera tras cuatro segundos sin recibir daño. Al morir
            reapareces a los tres segundos en el punto más alejado de los enemigos.
          </li>
          <li>
            Los bots patrullan, te ven dentro de su campo de visión, reaccionan y apuntan según su
            nivel.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Haz clic en la arena para capturar el ratón · ratón: mirar · <kbd>WASD</kbd>/flechas:
          mover · <kbd>Espacio</kbd>: saltar · <kbd>Mayús</kbd>/<kbd>C</kbd>: agacharse o deslizarse
          · clic izquierdo: disparar · clic derecho: apuntar · <kbd>R</kbd>: recargar · <kbd>Q</kbd>
          /<kbd>1</kbd>/<kbd>2</kbd>: cambiar de arma · <kbd>Tab</kbd>: marcador · <kbd>P</kbd>/
          <kbd>Esc</kbd>: pausa. En móvil: palanca a la izquierda, arrastra a la derecha para mirar
          y usa los botones.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Free-for-all: the first to the match’s kills (15 or 25) wins, or whoever has the most when
        time runs out (3 or 6 minutes).
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          <strong>Movement:</strong> run, crouch, slide (crouch while running) and jump. Holding
          jump hops again as you land without losing speed. You can walk up half-block steps and
          jump onto one-block crates.
        </li>
        <li>
          <strong>Weapons:</strong> the Rifleman carries an automatic rifle (30 rounds) and a
          pistol; the Marksman a sniper (3 rounds, 90 damage, accurate only when scoped) and a
          pistol. Head hits deal 50–60 % more. Running, jumping and rapid fire widen your spread;
          aiming tightens it. You reload when the magazine runs dry or with R.
        </li>
        <li>
          <strong>Health:</strong> 100, regenerating after four seconds without damage. When you die
          you respawn after three seconds at the spawn farthest from enemies.
        </li>
        <li>
          Bots patrol, see you within their field of view, react and aim according to their skill.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Click the arena to capture the mouse · mouse: look · <kbd>WASD</kbd>/arrows: move ·{' '}
        <kbd>Space</kbd>: jump · <kbd>Shift</kbd>/<kbd>C</kbd>: crouch or slide · left click: fire ·
        right click: aim · <kbd>R</kbd>: reload · <kbd>Q</kbd>/<kbd>1</kbd>/<kbd>2</kbd>: swap
        weapon · <kbd>Tab</kbd>: scoreboard · <kbd>P</kbd>/<kbd>Esc</kbd>: pause. On phones: stick
        on the left, drag on the right to look, and the buttons.
      </p>
    </>
  );
}
