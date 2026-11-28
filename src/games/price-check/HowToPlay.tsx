import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Adivina cuánto costaba de verdad un objeto real en su año: consolas y videojuegos al salir
          a la venta, ordenadores, cámaras y móviles, libros, programas, aviones y cuadros o huevos
          Fabergé subastados.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Ves la foto (o una ilustración), el nombre, la descripción, el año y la moneda.</li>
          <li>Ajusta el precio con − y + (÷/×1,5), el deslizador o escribiéndolo, y fíjalo.</li>
          <li>
            Puntos: 100 × e^(−1,5 × |ln(estimación/precio)|): un 10 % de error da 87; un 25 %, 72;
            un 50 %, 54; el doble o la mitad, 35. A menos del 2 % es un acierto exacto (100).
          </li>
          <li>
            Regla <b>Sin pasarse</b>: si dices más que el precio real (más de un 0,5 %), no puntúas.
          </li>
          <li>
            Al revelar ves también el precio en dinero de hoy, calculado con la inflación del Banco
            Mundial del país de cada moneda (la Unión Europea para el euro).
          </li>
        </ul>
        <h3>Modos</h3>
        <p>
          <b>Diario</b>: seis artículos con la regla del más cercano. <b>Sin fin</b>: regla,
          dificultad y categoría a elegir.
        </p>
        <h3>Datos</h3>
        <p>
          1.149 precios de Wikidata (CC0) con fecha, comprobados (coherentes, plausibles para su
          categoría, el más antiguo con fecha como precio de salida). 277 fotos de Wikimedia Commons
          con su autor y licencia; el resto usa ilustraciones propias. No hay precios de segunda
          mano: no existe una fuente abierta y verificable de ellos.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Guess what a real thing actually cost in its year: consoles and video games at launch,
        computers, cameras and phones, books, software, aircraft, and paintings or Fabergé eggs at
        auction.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>You see the photo (or an illustration), name, description, year and currency.</li>
        <li>Set the price with − and + (÷/×1.5), the slider or by typing it, then lock it in.</li>
        <li>
          Points: 100 × e^(−1.5 × |ln(guess/price)|): 10 % off scores 87; 25 %, 72; 50 %, 54; double
          or half, 35. Within 2 % counts as exact (100).
        </li>
        <li>
          <b>Don’t go over</b> rule: guessing above the real price (by more than 0.5 %) scores
          nothing.
        </li>
        <li>
          The reveal also shows the price in today’s money, using the World Bank inflation of each
          currency’s country (the European Union for the euro).
        </li>
      </ul>
      <h3>Modes</h3>
      <p>
        <b>Daily</b>: six items under the closest rule. <b>Endless</b>: choose the rule, difficulty
        and category.
      </p>
      <h3>Data</h3>
      <p>
        1,149 dated prices from Wikidata (CC0), checked (consistent, plausible for the category, the
        earliest dated price taken as the launch price). 277 photos from Wikimedia Commons with
        their author and licence; the rest use original illustrations. There are no second-hand
        prices: no open, verifiable source of them exists.
      </p>
    </>
  );
}
