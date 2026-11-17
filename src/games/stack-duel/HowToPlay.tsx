import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <ul>
          <li>
            <strong>Duelo:</strong> haz que el bot se desborde antes que tú. Una ronda o al mejor de
            tres.
          </li>
          <li>
            <strong>Blitz:</strong> el máximo de puntos en dos minutos.
          </li>
          <li>
            <strong>40 líneas:</strong> limpia 40 líneas lo antes posible.
          </li>
        </ul>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Pozo de 10 × 20 con bolsa de 7 piezas, cinco piezas de vista previa, reserva, pieza
            fantasma, giros con rebotes estándar y media vuelta.
          </li>
          <li>
            Basura enviada: doble 1, triple 2, cuádruple 4; T-spin sencillo 2, doble 4, triple 6; +1
            si encadenas dos líneas difíciles seguidas; combos +1 a +5; pozo limpio +10.
          </li>
          <li>
            Tus líneas anulan primero la basura que viene hacia ti. La basura que queda entra por
            abajo (máx. 8 filas, un hueco por ataque) cuando colocas una pieza sin limpiar.
          </li>
          <li>Desde el minuto 1:30 de cada ronda, los ataques crecen un 10 % cada 30 s.</li>
          <li>
            El indicador a la izquierda de cada pozo muestra la basura pendiente (naranja: en
            camino; rojo: lista para entrar).
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> mover · <kbd>↓</kbd> caída suave · <kbd>Espacio</kbd> caída
          rápida · <kbd>↑</kbd> girar a la derecha · <kbd>Z</kbd> a la izquierda · <kbd>X</kbd>/
          <kbd>Mayús</kbd> media vuelta · <kbd>C</kbd> reserva · <kbd>P</kbd> pausa · <kbd>R</kbd>{' '}
          reinicia. En móvil, botones táctiles.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <ul>
        <li>
          <strong>Versus:</strong> make the bot top out before you do. One round or first to two.
        </li>
        <li>
          <strong>Blitz:</strong> as many points as you can in two minutes.
        </li>
        <li>
          <strong>40 Lines:</strong> clear 40 lines as fast as you can.
        </li>
      </ul>
      <h3>How to play</h3>
      <ul>
        <li>
          A 10 × 20 well with a 7-bag, five-piece preview, hold, ghost piece, standard wall kicks
          and a half turn.
        </li>
        <li>
          Garbage sent: double 1, triple 2, quad 4; T-spin single 2, double 4, triple 6; +1 for
          back-to-back difficult clears; combos +1 to +5; all clear +10.
        </li>
        <li>
          Your clears cancel garbage coming at you first. Garbage left comes up from the bottom (at
          most 8 rows, one hole per attack) when you place a piece without clearing.
        </li>
        <li>From 1:30 into each round, attacks grow by 10 % every 30 s.</li>
        <li>
          The meter left of each well shows waiting garbage (orange: on its way; red: ready to come
          in).
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> move · <kbd>↓</kbd> soft drop · <kbd>Space</kbd> hard drop ·{' '}
        <kbd>↑</kbd> rotate clockwise · <kbd>Z</kbd> anticlockwise · <kbd>X</kbd>/<kbd>Shift</kbd>{' '}
        half turn · <kbd>C</kbd> hold · <kbd>P</kbd> pause · <kbd>R</kbd> restart. Touch buttons on
        phones.
      </p>
    </>
  );
}
