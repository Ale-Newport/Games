import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Descubrir todos los elementos combinando los que ya tienes. Empiezas con Agua, Fuego,
          Viento y Tierra.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Arrastra elementos de la lista al espacio de creación (o tócalos para colocarlos).
          </li>
          <li>
            Suelta uno sobre otro: si existe una receta, se convierten en un elemento nuevo. Los que
            descubres por primera vez se añaden a tu lista.
          </li>
          <li>No todas las parejas crean algo; prueba ideas lógicas (fuego + agua = vapor…).</li>
          <li>Doble clic duplica un elemento; clic derecho o arrastrarlo a la lista lo quita.</li>
          <li>La pista te dice un ingrediente de algo que ya puedes crear.</li>
          <li>Tu progreso se guarda automáticamente.</li>
        </ul>
        <h3>Teclado</h3>
        <p>
          Tab para moverte · <kbd>Intro</kbd> en un elemento de la lista lo coloca ·{' '}
          <kbd>Intro</kbd> en una ficha la selecciona y en otra las combina · <kbd>D</kbd> duplica ·{' '}
          <kbd>Supr</kbd> quita.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Discover every element by combining the ones you have. You start with Water, Fire, Wind and
        Earth.
      </p>
      <h3>How to play</h3>
      <ul>
        <li>Drag elements from the list onto the crafting space (or tap them to place them).</li>
        <li>
          Drop one onto another: if there is a recipe they turn into a new element. First-time
          discoveries are added to your list.
        </li>
        <li>Not every pair makes something; try ideas that make sense (fire + water = steam…).</li>
        <li>
          Double-click duplicates an element; right-click or dragging it back to the list removes
          it.
        </li>
        <li>A hint names one ingredient of something you can already make.</li>
        <li>Your progress is saved automatically.</li>
      </ul>
      <h3>Keyboard</h3>
      <p>
        Tab to move around · <kbd>Enter</kbd> on a list item places it · <kbd>Enter</kbd> on a chip
        selects it, and on another combines them · <kbd>D</kbd> duplicates · <kbd>Delete</kbd>{' '}
        removes.
      </p>
    </>
  );
}
