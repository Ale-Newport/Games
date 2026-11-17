import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el último jugador con vidas.</p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Quien tiene la bomba debe escribir una palabra (en inglés, 3+ letras) que contenga las
            letras de la bomba y que nadie haya usado en la partida.
          </li>
          <li>
            Con una palabra válida, la bomba pasa al siguiente con letras nuevas. La mecha (oculta,
            de 10 a 30 s) sigue ardiendo entre pases.
          </li>
          <li>
            Si estalla en tus manos, pierdes una vida (empiezas con 2, máximo 3) y empieza una bomba
            nueva con el siguiente.
          </li>
          <li>
            Usa en tus palabras todas las letras extra (todas menos K, W, X, Y, Z) para ganar una
            vida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the last player with lives left.</p>
      <h3>Rules</h3>
      <ul>
        <li>
          Whoever holds the bomb must type a word (English, 3+ letters) containing the letters on it
          that nobody has used this game.
        </li>
        <li>
          A valid word passes the bomb on with new letters. The fuse (hidden, 10–30 s) keeps burning
          across passes.
        </li>
        <li>
          If it explodes in your hands you lose a life (you start with 2, at most 3) and a new bomb
          starts with the next player.
        </li>
        <li>Use every bonus letter (all but K, W, X, Y, Z) in your words to win a life.</li>
      </ul>
    </>
  );
}
