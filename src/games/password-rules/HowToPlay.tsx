import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Elegir una contraseña que cumpla las 28 reglas a la vez y confirmarla volviéndola a
          escribir.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Cada vez que cumples todas las reglas visibles aparece una nueva. Las incumplidas salen
            arriba en rojo.
          </li>
          <li>
            Algunas reglas chocan entre sí (los dígitos deben sumar 25 pero también hay que incluir
            la longitud, la hora, un año bisiesto…): ¡es parte del reto! El CAPTCHA y el color se
            pueden cambiar.
          </li>
          <li>
            Paul 🥚 debe estar siempre en la contraseña. Cuando nace 🐔 hay que darle un 🐛 cada 20
            segundos (sin pasar de seis). El fuego 🔥 se extiende cada segundo: bórralo antes de que
            llegue a Paul.
          </li>
          <li>
            Cada carácter tiene su propio formato: selecciona texto y usa Negrita, Cursiva, la
            fuente y el tamaño.
          </li>
          <li>
            Los botones de emoji insertan 🥚 🐛 💪 y las fases de la luna donde está el cursor.
          </li>
        </ul>
        <h3>Teclado</h3>
        <p>
          Escribe en el campo · <kbd>Ctrl</kbd>+<kbd>B</kbd> negrita · <kbd>Ctrl</kbd>+<kbd>I</kbd>{' '}
          cursiva · pegar inserta texto sin formato.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Choose a password that meets all 28 rules at once, then confirm it by typing it again.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Each time you meet every visible rule, a new one appears. Broken rules show at the top in
          red.
        </li>
        <li>
          Some rules fight each other (the digits must add up to 25, but you also need the length,
          the time, a leap year…): that is the challenge! The CAPTCHA and the colour can be changed.
        </li>
        <li>
          Paul 🥚 must stay in the password. Once he hatches 🐔 he needs a 🐛 every 20 seconds (no
          more than six). Fire 🔥 spreads every second: delete it before it reaches Paul.
        </li>
        <li>
          Every character has its own formatting: select text and use Bold, Italic, the font and the
          size.
        </li>
        <li>The emoji buttons insert 🥚 🐛 💪 and the moon phases at the caret.</li>
      </ul>
      <h3>Keyboard</h3>
      <p>
        Type in the field · <kbd>Ctrl</kbd>+<kbd>B</kbd> bold · <kbd>Ctrl</kbd>+<kbd>I</kbd> italic
        · pasting inserts plain text.
      </p>
    </>
  );
}
