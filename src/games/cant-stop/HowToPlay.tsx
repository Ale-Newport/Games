import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sé el primero en conquistar la cima de tres columnas.</p>
        <h3>Turno</h3>
        <ul>
          <li>
            Tira cuatro dados y júntalos en dos parejas: cada suma (del 2 al 12) es una columna.
          </li>
          <li>
            Elige un emparejamiento y sube un escalón por cada suma. Tienes tres escaladores por
            turno: una columna nueva necesita uno libre.
          </li>
          <li>
            Puedes seguir tirando o pararte: al pararte, tus marcas suben hasta donde están los
            escaladores.
          </li>
          <li>
            Si una tirada no permite subir en ninguna columna, fallas: pierdes lo subido en ese
            turno.
          </li>
          <li>Llegar a la cima de una columna y pararte la conquista: nadie más puede subirla.</li>
        </ul>
        <p>
          Las columnas del centro son más largas (13 escalones el 7) y las de los extremos, más
          cortas (3 escalones el 2 y el 12).
        </p>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · <kbd>S</kbd> pararse · <kbd>1</kbd>–<kbd>6</kbd>{' '}
          elegir subida · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to claim the summit of three columns.</p>
      <h3>A turn</h3>
      <ul>
        <li>Roll four dice and pair them up: each sum (2 to 12) is a column.</li>
        <li>
          Choose a pairing and climb one step for each sum. You have three climbers a turn: a new
          column needs a free one.
        </li>
        <li>Keep rolling or stop: when you stop, your markers move up to your climbers.</li>
        <li>A roll that lets you climb no column is a bust: you lose that turn's climb.</li>
        <li>Reach the top of a column and stop to claim it: nobody else may climb it.</li>
      </ul>
      <p>
        The middle columns are longer (13 steps for the 7) and the outer ones shorter (3 steps for
        the 2 and the 12).
      </p>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll · <kbd>S</kbd> stop · <kbd>1</kbd>–<kbd>6</kbd> choose
        a climb · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
