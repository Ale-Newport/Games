import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Encontrar todas las palabras del tema. Juntas usan cada letra de la cuadrícula exactamente
          una vez.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Traza una palabra uniendo letras contiguas en cualquiera de las ocho direcciones
            (también en diagonal). Las palabras pueden girar.
          </li>
          <li>
            Las palabras del tema se vuelven azules. La <strong>palabra puente</strong> (amarilla)
            describe el tema y toca dos lados opuestos.
          </li>
          <li>
            Otras palabras reales de cuatro letras o más llenan el medidor: cada tres, una{' '}
            <strong>pista</strong> rodea las letras de una palabra del tema; otra pista sobre la
            misma revela su orden.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Arrastra sobre las letras, o tócalas una a una y toca la última otra vez para enviar.
          Teclado: flechas, <kbd>Espacio</kbd> añade la letra, <kbd>Intro</kbd> envía,{' '}
          <kbd>Retroceso</kbd> borra.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Find every theme word. Together they use every letter of the grid exactly once.</p>
      <h3>Rules</h3>
      <ul>
        <li>
          Trace a word by joining touching letters in any of eight directions (diagonals too). Words
          can bend.
        </li>
        <li>
          Theme words turn blue. The <strong>spangram</strong> (yellow) names the theme and touches
          two opposite sides.
        </li>
        <li>
          Other real words of four or more letters fill the meter: every three earn a{' '}
          <strong>hint</strong> that outlines a theme word’s letters; a second hint on it reveals
          their order.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Drag across letters, or tap them one by one and tap the last again to submit. Keyboard:
        arrows, <kbd>Space</kbd> adds a letter, <kbd>Enter</kbd> submits, <kbd>Backspace</kbd>{' '}
        removes.
      </p>
    </>
  );
}
