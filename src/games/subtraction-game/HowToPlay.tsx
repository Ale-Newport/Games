import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser quien <strong>tome la última ficha</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cada ronda empieza con un montón de 15 a 30 fichas; el primer turno se alterna.</li>
          <li>
            En tu turno toma <strong>1, 2 o 3 fichas</strong>.
          </li>
          <li>Quien toma la última ficha gana. No hay tablas.</li>
          <li>Pista: piensa qué cantidades le dejan al rival sin salida… y si siguen un patrón.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una de las tres últimas fichas para marcar cuántas tomar; toca de nuevo o pulsa
            «Tomar» para confirmar.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> elegir / confirmar, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the one who <strong>takes the last counter</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Each round starts with one heap of 15 to 30 counters; the first turn alternates.</li>
        <li>
          On your turn take <strong>1, 2 or 3 counters</strong>.
        </li>
        <li>Whoever takes the last counter wins. There are no draws.</li>
        <li>Hint: which amounts leave your opponent stuck… and do they follow a pattern?</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap one of the last three counters to mark how many to take; tap again or press “Take” to
          confirm.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> choose / confirm, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
