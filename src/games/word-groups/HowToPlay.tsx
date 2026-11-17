import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Encontrar los cuatro grupos de cuatro palabras que tienen algo en común.</p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Elige cuatro palabras y pulsa «Enviar». Si forman un grupo, aparece su barra de color
            con el nombre del grupo.
          </li>
          <li>
            Cada envío equivocado gasta uno de los cuatro errores. «Te falta una» significa que tres
            de las cuatro van juntas.
          </li>
          <li>
            Los grupos van del amarillo (directo) al verde, azul y morado (juegos de palabras,
            palabras escondidas, «___ de»).
          </li>
          <li>
            Algunas palabras encajan en dos grupos, pero solo hay una forma de repartirlas todas.
          </li>
          <li>Repetir un envío no cuenta como error.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca las palabras o usa las flechas y <kbd>Espacio</kbd>; <kbd>S</kbd> envía, <kbd>D</kbd>{' '}
          quita la selección.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Find the four groups of four words that share something.</p>
      <h3>Rules</h3>
      <ul>
        <li>
          Select four words and press Submit. If they form a group, its coloured bar appears with
          the group’s name.
        </li>
        <li>
          Each wrong submission uses one of four mistakes. “One away” means three of the four belong
          together.
        </li>
        <li>
          Groups range from yellow (straightforward) through green and blue to purple (wordplay,
          hidden words, “___ pie”).
        </li>
        <li>Some words fit two groups, but there is only one way to split all sixteen.</li>
        <li>Repeating a submission does not count as a mistake.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap words or use the arrows and <kbd>Space</kbd>; <kbd>S</kbd> submits, <kbd>D</kbd>{' '}
        deselects.
      </p>
    </>
  );
}
