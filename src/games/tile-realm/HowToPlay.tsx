import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Tener más puntos cuando se acaben las losetas.</p>
        <h3>Turno</h3>
        <ul>
          <li>
            Saca una loseta y colócala junto a las que ya hay, de modo que cada lado que toque case:
            villa con villa, camino con camino, pradera con pradera. Puedes girarla. Si no cabe en
            ningún sitio, se aparta y se saca otra.
          </li>
          <li>
            Después puedes poner uno de tus siete guardianes en un elemento de esa loseta (villa,
            camino, pradera o santuario), si nadie tiene ya un guardián en el elemento entero al que
            se une.
          </li>
          <li>
            Si la loseta termina algo, puntúa ya para quien tenga más guardianes en ello (los
            empatados cobran todos) y esos guardianes vuelven a su dueño.
          </li>
        </ul>
        <h3>Puntos</h3>
        <ul>
          <li>
            Camino terminado (sus dos extremos cerrados en cruces, villas o santuarios, o en un
            bucle): 1 por loseta.
          </li>
          <li>Villa terminada (murallas cerradas): 2 por loseta y 2 por estandarte.</li>
          <li>Santuario rodeado por sus ocho vecinos: 9.</li>
          <li>
            Al final: caminos sin terminar 1 por loseta; villas 1 por loseta y estandarte;
            santuarios 1 más sus vecinos; praderas 3 por cada villa terminada que tocan. Los
            guardianes en praderas se quedan hasta el final.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Elige un cuadro resaltado; la loseta se coloca girada para encajar (gírala con los botones
          o <kbd>R</kbd>). Toca un círculo para poner un guardián y confirma. <kbd>Intro</kbd>{' '}
          confirmar · <kbd>N</kbd> sin guardián · <kbd>H</kbd> pista · <kbd>Esc</kbd> cancelar ·{' '}
          <kbd>+</kbd>/<kbd>−</kbd> zoom.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Have the most points when the tiles run out.</p>
      <h3>A turn</h3>
      <ul>
        <li>
          Draw a tile and place it next to the tiles already down so that every side it touches
          matches: town to town, road to road, meadow to meadow. You may turn it. If it fits nowhere
          it is set aside and another drawn.
        </li>
        <li>
          Then you may stand one of your seven wardens on a feature of that tile (town, road, meadow
          or shrine), if nobody has a warden on the whole feature it joins.
        </li>
        <li>
          If the tile finishes something, it scores at once for whoever has most wardens on it (ties
          all score) and those wardens go back to their owners.
        </li>
      </ul>
      <h3>Points</h3>
      <ul>
        <li>
          Finished road (both ends closed at junctions, towns or shrines, or a loop): 1 a tile.
        </li>
        <li>Finished town (walls closed): 2 a tile and 2 a banner.</li>
        <li>Shrine with all eight neighbours: 9.</li>
        <li>
          At the end: unfinished roads 1 a tile; towns 1 a tile and banner; shrines 1 plus
          neighbours; meadows 3 for each finished town they border. Wardens on meadows stay until
          the end.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Pick a highlighted square; the tile goes down turned to fit (turn it with the buttons or{' '}
        <kbd>R</kbd>). Tap a circle to stand a warden, then confirm. <kbd>Enter</kbd> confirm ·{' '}
        <kbd>N</kbd> no warden · <kbd>H</kbd> hint · <kbd>Esc</kbd> cancel · <kbd>+</kbd>/
        <kbd>−</kbd> zoom.
      </p>
    </>
  );
}
