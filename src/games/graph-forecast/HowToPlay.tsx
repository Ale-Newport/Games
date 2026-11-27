import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Cada gráfica es una serie real del Banco Mundial (población, PIB, esperanza de vida,
          emisiones, internet…) de un país o región con sus últimos años ocultos. Dibuja cómo crees
          que continúa: cuanto más cerca de la realidad, más puntos.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Dibuja en la zona rayada, desde el punto hasta el borde derecho. Puedes hacerlo de un
            trazo o en varios; cada trazo nuevo sustituye los años que cruza. «Borrar» empieza de
            nuevo.
          </li>
          <li>
            Los años que dejes sin dibujar entre dos tramos se unen en línea recta (también desde el
            último punto visible). La línea tiene que llegar al último año.
          </li>
          <li>
            Al enviar aparece la línea real. La precisión (0–100) depende de la distancia media
            entre tu línea y la real, medida en proporción a la altura de la gráfica: 1 % de
            desviación da 90, 5 % da 61, 10 % da 37 y 25 % da 8.
          </li>
          <li>
            El ordenador pronostica la misma gráfica sin ver los años ocultos: prueba ocho métodos
            (línea plana, tendencias, crecimiento, vuelta a la media…) con los años visibles y usa
            el que mejor habría acertado. ¿Le ganas?
          </li>
        </ul>
        <h3>Modos</h3>
        <ul>
          <li>
            <b>Diario</b>: cinco gráficas de dificultad normal, las mismas para todos ese día
            (máximo 500). Se juega una vez al día y cuenta para la racha.
          </li>
          <li>
            <b>Sin fin</b>: gráficas sin límite, con dificultad y tema a elegir. Las series vistas
            recientemente se evitan. «Terminar» guarda el resultado.
          </li>
          <li>
            Fácil: series suaves, se oculta el último 20 % de la ventana. Normal: casi todas, 30 %.
            Difícil: todas (también crecimiento e inflación), 40 % y ventanas de hasta 60 años.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Ratón o dedo para dibujar. Con el teclado, enfoca la gráfica: <kbd>←</kbd>/<kbd>→</kbd>{' '}
          eligen un año, <kbd>↑</kbd>/<kbd>↓</kbd> lo suben o bajan un 1 % (con <kbd>Mayús</kbd>, un
          5 %), <kbd>Espacio</kbd> fija el año (si está vacío, copia el anterior) y avanza,{' '}
          <kbd>Intro</kbd> envía.
        </p>
        <h3>Datos</h3>
        <p>
          7.615 series de 44 indicadores para 217 países y territorios y 12 regiones o grupos de
          ingreso (Indicadores del Desarrollo Mundial del Banco Mundial, CC BY 4.0). Solo se usan
          años consecutivos con dato publicado; nada se interpola ni se inventa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Every graph is a real World Bank series (population, GDP, life expectancy, emissions,
        internet use…) for a country or region with its last years hidden. Draw how you think it
        continues: the closer to reality, the more points.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>
          Draw in the hatched zone, from the dot to the right edge — in one stroke or several; each
          new stroke replaces the years it crosses. “Clear” starts again.
        </li>
        <li>
          Years left undrawn between two stretches are joined with a straight line (from the last
          visible point too). The line must reach the last year.
        </li>
        <li>
          Submitting reveals the real line. Accuracy (0–100) comes from the mean distance between
          your line and the real one, as a share of the chart height: 1 % off scores 90, 5 % scores
          61, 10 % scores 37 and 25 % scores 8.
        </li>
        <li>
          The computer forecasts the same graph without seeing the hidden years: it tests eight
          methods (flat line, trends, growth rate, back to average…) on the visible years and uses
          the one that would have done best. Can you beat it?
        </li>
      </ul>
      <h3>Modes</h3>
      <ul>
        <li>
          <b>Daily</b>: five Normal graphs, the same for everyone that day (500 max). Played once a
          day; it builds your streak.
        </li>
        <li>
          <b>Endless</b>: graphs without end, with a difficulty and topic of your choice. Recently
          seen series are avoided. “End run” records the result.
        </li>
        <li>
          Easy: smooth series, the last 20 % of the window hidden. Normal: almost every series, 30
          %. Hard: every series (growth and inflation too), 40 % and windows up to 60 years.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Mouse or finger to draw. With the keyboard, focus the chart: <kbd>←</kbd>/<kbd>→</kbd> pick
        a year, <kbd>↑</kbd>/<kbd>↓</kbd> move it by 1 % (with <kbd>Shift</kbd>, 5 %),{' '}
        <kbd>Space</kbd> keeps the year (copying the previous one if empty) and moves on,{' '}
        <kbd>Enter</kbd> submits.
      </p>
      <h3>Data</h3>
      <p>
        7,615 series of 44 indicators for 217 countries and territories and 12 regions or income
        groups (World Bank World Development Indicators, CC BY 4.0). Only consecutive years with a
        published value are used; nothing is interpolated or invented.
      </p>
    </>
  );
}
