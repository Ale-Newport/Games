import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Cerrar todas las fichas del 1 al 9, o dejar abiertas las que menos sumen.</p>
        <h3>Turno</h3>
        <ul>
          <li>
            Tira dos dados y cierra fichas abiertas que sumen exactamente la tirada (una o varias).
          </li>
          <li>Cuando las fichas abiertas suman 6 o menos, puedes tirar un solo dado.</li>
          <li>
            Si ninguna combinación de fichas abiertas suma la tirada, el turno acaba: tu puntuación
            es la suma de las fichas abiertas.
          </li>
          <li>Cerrar todas las fichas («cerrar la caja») vale 0 y gana al instante.</li>
        </ul>
        <p>
          Con varios jugadores, cada uno juega un turno con la caja abierta y gana la puntuación más
          baja.
        </p>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · <kbd>O</kbd> un dado · <kbd>1</kbd>–<kbd>9</kbd>{' '}
          elegir ficha ·<kbd>Enter</kbd> cerrar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Shut every tile from 1 to 9, or leave open the tiles with the smallest sum.</p>
      <h3>A turn</h3>
      <ul>
        <li>
          Roll two dice and shut open tiles that add up to exactly the throw (one or several).
        </li>
        <li>Once the open tiles add up to 6 or less, you may roll a single die.</li>
        <li>
          When no open tiles add up to the throw, the turn ends: your score is the sum of the open
          tiles.
        </li>
        <li>Shutting every tile ("shutting the box") scores 0 and wins at once.</li>
      </ul>
      <p>With several players, each plays one turn on a fresh box and the lowest score wins.</p>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll · <kbd>O</kbd> one die · <kbd>1</kbd>–<kbd>9</kbd>{' '}
        choose a tile · <kbd>Enter</kbd> shut · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
