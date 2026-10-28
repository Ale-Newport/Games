import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Saca el coche rojo del aparcamiento por el hueco del lado derecho de su fila.</p>
        <h3>Movimientos</h3>
        <ul>
          <li>Los coches ocupan dos casillas y los camiones tres.</li>
          <li>
            Cada vehículo solo avanza o retrocede a lo largo de su carril: los horizontales a
            izquierda y derecha, los verticales arriba y abajo.
          </li>
          <li>Ningún vehículo puede atravesar a otro.</li>
          <li>Deslizar un vehículo cualquier distancia cuenta como un movimiento.</li>
        </ul>
        <p>
          Cada puzle muestra el mínimo de movimientos posible. Los puzles los ha creado el generador
          del juego: explora todas las posiciones alcanzables y elige la más lejana a la salida.
        </p>
        <h3>Controles</h3>
        <p>
          Arrastra los vehículos. Con teclado: <kbd>Tab</kbd> elige vehículo, las flechas lo
          deslizan · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Get the red car out of the lot through the gap on the right of its row.</p>
      <h3>Moves</h3>
      <ul>
        <li>Cars take two cells and trucks three.</li>
        <li>
          Each vehicle only moves along its lane: horizontal ones left and right, vertical ones up
          and down.
        </li>
        <li>No vehicle can pass through another.</li>
        <li>Sliding a vehicle any distance counts as one move.</li>
      </ul>
      <p>
        Every puzzle shows the fewest moves possible. The puzzles were made by the game’s generator:
        it explores every reachable position and picks the one farthest from the exit.
      </p>
      <h3>Controls</h3>
      <p>
        Drag the vehicles. With a keyboard: <kbd>Tab</kbd> picks a vehicle, the arrows slide it ·{' '}
        <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
