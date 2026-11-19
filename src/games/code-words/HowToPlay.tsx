import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Que tu equipo (rojo) encuentre a todos sus agentes antes que el azul, sin tocar al
          asesino.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            El tablero tiene 25 palabras: 9 agentes del equipo que empieza, 8 del otro, 7
            transeúntes y 1 asesino. Solo los jefes de espías ven la clave.
          </li>
          <li>
            En su turno, el jefe da una <strong>pista de una palabra</strong> y un{' '}
            <strong>número</strong>: cuántas palabras del tablero se relacionan con ella. No puede
            ser una palabra del tablero ni parte de una.
          </li>
          <li>
            Los agentes tocan palabras una a una. Agente propio: pueden seguir (hasta número + 1).
            Transeúnte o agente rival: se acaba el turno. Asesino: pierden.
          </li>
          <li>Tras acertar al menos una, pueden terminar el turno cuando quieran.</li>
        </ul>
        <p>
          Las palabras y pistas son en español (en inglés si el idioma es inglés): los bots razonan
          con vectores de significado.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Get your team (red) to find all its agents before blue does, without touching the assassin.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          The board has 25 words: 9 agents of the starting team, 8 of the other, 7 bystanders and 1
          assassin. Only spymasters see the key.
        </li>
        <li>
          On their turn the spymaster gives a <strong>one-word clue</strong> and a{' '}
          <strong>number</strong>: how many board words it relates to. It cannot be a board word or
          part of one.
        </li>
        <li>
          Operatives touch words one at a time. Own agent: keep going (up to number + 1). Bystander
          or rival agent: the turn ends. Assassin: they lose.
        </li>
        <li>After at least one right guess they may end the turn whenever they like.</li>
      </ul>
      <p>
        Words and clues are English (Spanish when the language is set to Spanish): the bots reason
        with word-meaning vectors.
      </p>
    </>
  );
}
