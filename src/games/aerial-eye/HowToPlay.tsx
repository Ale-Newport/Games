import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada ronda es una <b>fotografía aérea</b> real de un lugar —un aeropuerto, un circuito,
          una ciudad, un castillo, un volcán, una isla…— y seis lugares <b>del mismo tipo</b>. ¿Cuál
          es?
        </p>
        <h3>Cómo se juega</h3>
        <p>
          La foto empieza ampliada ×2,2 en su centro. Si fallas, esa opción se tacha y la foto se
          aleja (×1,5 y luego entera). Tres intentos: 100, 50 o 20 puntos. Al final ves la foto
          completa, dónde está en el mapa y quién la hizo.
        </p>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: cinco fotos de cinco tipos distintos, las mismas para todos (máximo 500).{' '}
          <b>Sin fin</b>: tipo de lugar y dificultad a elegir.
        </p>
        <h3>Fotos y datos</h3>
        <p>
          365 fotografías de Wikimedia Commons, cada una con su licencia libre (dominio público,
          CC0, CC BY, CC BY-SA…) y su autor, enlazadas desde la vista aérea (P8592) de cada lugar en
          Wikidata, de donde salen también el nombre, el país y las coordenadas.
        </p>
        <h3>Controles</h3>
        <p>
          Toca o pulsa una opción, o usa las teclas <kbd>1</kbd>–<kbd>6</kbd>.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Each round is a real <b>aerial photograph</b> of a place — an airport, a racing circuit, a
        city, a castle, a volcano, an island… — and six places <b>of the same kind</b>. Which one is
        it?
      </p>
      <h3>Play</h3>
      <p>
        The photo starts zoomed ×2.2 on its centre. A wrong pick strikes that option and the photo
        zooms out (×1.5, then whole). Three picks: 100, 50 or 20 points. Then you see the whole
        photo, where the place is on a map and who took the picture.
      </p>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: five photos of five different kinds, the same for everyone (500 max).{' '}
        <b>Endless</b>: pick a kind of place and a difficulty.
      </p>
      <h3>Photos and data</h3>
      <p>
        365 photographs from Wikimedia Commons, each under its own free licence (public domain, CC0,
        CC BY, CC BY-SA…) and credited to its author, linked from each place’s aerial view (P8592)
        on Wikidata, which also gives the name, country and coordinates.
      </p>
      <h3>Controls</h3>
      <p>
        Tap or click an option, or use the keys <kbd>1</kbd>–<kbd>6</kbd>.
      </p>
    </>
  );
}
