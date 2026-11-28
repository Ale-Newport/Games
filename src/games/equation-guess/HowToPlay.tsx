import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Descubre la <b>ecuación oculta</b>: una igualdad cierta de 6 u 8 caracteres, como{' '}
          <b>82−57=25</b>, hecha de cifras, + − × ÷ y un «=».
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Cada intento tiene que ser una ecuación cierta del tamaño justo.</li>
          <li>
            Después, cada símbolo se colorea: <b>verde</b> si está en su sitio, <b>amarillo</b> si
            está en la ecuación pero en otro sitio, <b>gris</b> si no está (o no tantas veces).
          </li>
          <li>
            Se calcula con la prioridad habitual (× y ÷ antes que + y −) y el resultado tiene que
            ser exacto. A la derecha del «=» va un único número. Sin ceros a la izquierda.
          </li>
        </ul>
        <h3>Tamaños</h3>
        <p>
          <b>Mini</b>: 6 caracteres, 6 intentos. <b>Clásica</b>: 8 caracteres, 6 intentos.{' '}
          <b>Difícil</b>: 8 caracteres, 5 intentos. Las respuestas nunca son triviales (sin ×0, ×1,
          ÷1 ni resultado 0).
        </p>
        <h3>Puntuación</h3>
        <p>
          Resolver en el intento 1, 2, 3… vale 100, 85, 70, 55, 40, 25; no resolverla, 0. El diario
          tiene una ecuación de cada tamaño (máximo 300).
        </p>
        <h3>Controles</h3>
        <p>
          Teclado en pantalla o físico: cifras, + − = , <kbd>x</kbd> o <kbd>*</kbd> para ×,{' '}
          <kbd>:</kbd> o <kbd>/</kbd> para ÷, <kbd>Intro</kbd> prueba, <kbd>Retroceso</kbd> borra.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Find the <b>hidden equation</b>: a true statement of 6 or 8 characters, such as{' '}
        <b>82−57=25</b>, made of digits, + − × ÷ and one “=”.
      </p>
      <h3>Play</h3>
      <ul>
        <li>Every guess must be a true equation of the right size.</li>
        <li>
          Then each symbol is coloured: <b>green</b> if it is in the right place, <b>yellow</b> if
          it is in the equation but elsewhere, <b>grey</b> if it is not (or not that many times).
        </li>
        <li>
          Usual precedence (× and ÷ before + and −) and the result must come out exact. A single
          number goes after the “=”. No leading zeros.
        </li>
      </ul>
      <h3>Sizes</h3>
      <p>
        <b>Mini</b>: 6 characters, 6 tries. <b>Classic</b>: 8 characters, 6 tries. <b>Hard</b>: 8
        characters, 5 tries. Answers are never trivial (no ×0, ×1, ÷1 or 0 result).
      </p>
      <h3>Scoring</h3>
      <p>
        Solving on try 1, 2, 3… is worth 100, 85, 70, 55, 40, 25; not solving, 0. The daily has one
        equation of each size (300 max).
      </p>
      <h3>Controls</h3>
      <p>
        On-screen or physical keyboard: digits, + − =, <kbd>x</kbd> or <kbd>*</kbd> for ×,{' '}
        <kbd>:</kbd> or <kbd>/</kbd> for ÷, <kbd>Enter</kbd> guesses, <kbd>Backspace</kbd> erases.
      </p>
    </>
  );
}
