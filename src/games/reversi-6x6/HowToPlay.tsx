import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Terminar la partida con <strong>más fichas de tu color</strong> que tu rival.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Tablero de 6×6. Se empieza con cuatro fichas en el centro. Negras juegan primero.</li>
          <li>
            Coloca una ficha de forma que encierres, en línea recta (horizontal, vertical o
            diagonal), una o más fichas rivales entre la nueva ficha y otra tuya. Todas las fichas
            encerradas, en todas las direcciones, se voltean a tu color.
          </li>
          <li>
            Si no tienes ninguna jugada legal, debes <strong>pasar</strong>. No puedes pasar si
            tienes jugadas.
          </li>
          <li>
            La partida termina cuando ninguno de los dos puede jugar. Gana quien tenga más fichas;
            con igual número, es empate.
          </li>
        </ul>
        <h3>Consejos</h3>
        <ul>
          <li>
            En 6×6 hay muy pocas casillas: cada esquina y cada tempo deciden la partida. Con juego
            perfecto ganan blancas.
          </li>
          <li>Evita las casillas junto a una esquina libre: suelen regalársela al rival.</li>
          <li>
            Tener muchas jugadas disponibles (movilidad) importa más que tener muchas fichas a mitad
            de partida.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una casilla con un punto (jugada legal).</li>
          <li>
            Flechas e <kbd>Intro</kbd> · <kbd>P</kbd> pasar · <kbd>U</kbd> deshacer · <kbd>H</kbd>{' '}
            pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Finish with <strong>more discs of your color</strong> than your opponent.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>6×6 board. The game starts with four discs in the center. Black moves first.</li>
        <li>
          Place a disc so that one or more of your opponent's discs are bracketed in a straight line
          (horizontal, vertical or diagonal) between the new disc and another of yours. Every
          bracketed disc, in every direction, flips to your color.
        </li>
        <li>
          If you have no legal move you must <strong>pass</strong>. You may not pass when you have a
          move.
        </li>
        <li>
          The game ends when neither player can move. More discs wins; equal counts is a draw.
        </li>
      </ul>
      <h3>Tips</h3>
      <ul>
        <li>
          On 6×6 there are very few squares: every corner and every tempo decides the game. With
          perfect play White wins.
        </li>
        <li>Avoid the squares next to an empty corner: they usually hand it to your opponent.</li>
        <li>
          Having many moves available (mobility) matters more than having many discs in the middle
          game.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a square showing a dot (a legal move).</li>
        <li>
          Arrows and <kbd>Enter</kbd> · <kbd>P</kbd> pass · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
