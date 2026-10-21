import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Da <strong>jaque mate</strong> al general rival. Cho (azul, abajo) mueve primero; Han
          (rojo) recibe 1,5 puntos de compensación.
        </p>
        <h3>Piezas</h3>
        <ul>
          <li>
            <strong>General</strong> y <strong>guardias</strong>: un paso por las líneas del palacio
            (también las diagonales), sin salir de él.
          </li>
          <li>
            <strong>Caballo</strong>: un paso recto y uno en diagonal (se bloquea como en el
            xiangqi). <strong>Elefante</strong>: un paso recto y dos en diagonal; cualquier punto
            intermedio ocupado lo bloquea. No hay río.
          </li>
          <li>
            <strong>Carro</strong>: en línea recta, y por las diagonales de cualquier palacio.
          </li>
          <li>
            <strong>Cañón</strong>: siempre salta exactamente una pieza para moverse o capturar
            (también por las diagonales del palacio); no puede saltar otro cañón ni capturarlo.
          </li>
          <li>
            <strong>Soldado</strong>: un paso hacia delante o a los lados; dentro del palacio rival
            también en diagonal hacia delante.
          </li>
        </ul>
        <h3>Reglas especiales</h3>
        <ul>
          <li>
            Puedes <strong>pasar</strong> el turno si no estás en jaque.
          </li>
          <li>
            <strong>Bikjang</strong>: si los generales quedan cara a cara sin piezas entre ellos y
            el rival no lo rompe, la partida se decide por puntos (carro 13, cañón 7, caballo 5,
            elefante 3, guardia 3, soldado 2; Han +1,5). También al pasar ambos seguidos o tras 300
            jugadas.
          </li>
          <li>Triple repetición: tablas, salvo jaque perpetuo (pierde quien lo da).</li>
          <li>
            Cada ronda sortea la disposición de caballos (C) y elefantes (E) de cada bando; en la
            vida real la elige cada jugador.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza y luego su destino; «Pasar» bajo el tablero.</li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / mover, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        <strong>Checkmate</strong> the enemy general. Cho (blue, bottom) moves first; Han (red)
        receives 1.5 points of compensation.
      </p>
      <h3>Pieces</h3>
      <ul>
        <li>
          <strong>General</strong> and <strong>guards</strong>: one step along the palace lines
          (diagonals included), never leaving the palace.
        </li>
        <li>
          <strong>Horse</strong>: one step straight and one diagonally (blocked as in xiangqi).{' '}
          <strong>Elephant</strong>: one step straight and two diagonally; any occupied point on the
          way blocks it. There is no river.
        </li>
        <li>
          <strong>Chariot</strong>: straight lines, and along the diagonals of either palace.
        </li>
        <li>
          <strong>Cannon</strong>: always jumps exactly one piece to move or capture (palace
          diagonals too); it may not jump over or capture another cannon.
        </li>
        <li>
          <strong>Soldier</strong>: one step forward or sideways; inside the enemy palace also
          diagonally forward.
        </li>
      </ul>
      <h3>Special rules</h3>
      <ul>
        <li>
          You may <strong>pass</strong> when not in check.
        </li>
        <li>
          <strong>Bikjang</strong>: if the generals face each other with nothing between and the
          opponent does not break it, the game is decided on points (chariot 13, cannon 7, horse 5,
          elephant 3, guard 3, soldier 2; Han +1.5). Also after two passes in a row or 300 plies.
        </li>
        <li>Threefold repetition is a draw, except perpetual check (the checker loses).</li>
        <li>
          Each round draws both sides' horse (H) / elephant (E) order at random; in real play each
          player chooses it.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a piece, then its destination; “Pass” is below the board.</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
