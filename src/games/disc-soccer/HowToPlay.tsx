import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Marcar más goles que el equipo azul. El partido acaba al llegar al tiempo (3 o 5 minutos)
          o cuando un equipo alcanza esos goles; si hay empate al final, la prórroga es a gol de
          oro.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Eres el disco rojo con la estrella; los demás discos son bots.</li>
          <li>
            Los discos aceleran y se deslizan. Si tocas el balón sin chutar lo empujas (conducción);
            mantén la patada para golpearlo fuerte cuando lo tengas pegado. Chutar te hace un poco
            más lento.
          </li>
          <li>
            El balón rebota en las bandas y en los postes. Solo es gol si cruza la línea entre los
            dos postes.
          </li>
          <li>
            En cada saque, el equipo que no saca debe esperar fuera del círculo central y en su
            campo hasta que alguien toque el balón. Tras un gol saca el equipo que lo encajó.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>←</kbd>
          <kbd>→</kbd> o <kbd>WASD</kbd> para moverte (también en diagonal) · <kbd>Espacio</kbd> o{' '}
          <kbd>X</kbd> para chutar · botones táctiles en móvil · <kbd>P</kbd> pausa · <kbd>R</kbd>{' '}
          reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Outscore the blue team. The match ends when time runs out (3 or 5 minutes) or a team reaches
        that many goals; if it is level at the end, overtime is golden goal.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>You are the red disc with the star; every other disc is a bot.</li>
        <li>
          Discs accelerate and glide. Touching the ball without kicking pushes it (dribbling); hold
          kick to strike it hard when it is close. Kicking slows you down a little.
        </li>
        <li>
          The ball bounces off the side walls and the posts. It is only a goal if it crosses the
          line between the two posts.
        </li>
        <li>
          At every kick-off the other team must wait outside the centre circle in its own half until
          someone touches the ball. After a goal, the team that conceded kicks off.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        <kbd>←</kbd>
        <kbd>→</kbd> or <kbd>WASD</kbd> to move (diagonals too) · <kbd>Space</kbd> or <kbd>X</kbd>{' '}
        to kick · touch buttons on phones · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
