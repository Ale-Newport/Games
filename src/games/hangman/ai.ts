/**
 * Hangman agents: a random letter, letters in order of frequency in the language, and the solver
 * (the letter found in the most listed words that still fit, frequency breaking ties).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { ALPHABET, bestLetter, type HangmanState } from './engine';

const ORDER = {
  en: 'etaoinshrdlcumwfgypbvkjxqz',
  es: 'eaosrnidlctumpbgvyqhfzjñxkw',
};

export const hangmanActions = (s: HangmanState) =>
  s.status === 'playing' ? [...ALPHABET[s.lang]].filter((l) => !s.guessed.includes(l)) : [];

export const frequencyMove = (s: HangmanState) =>
  [...ORDER[s.lang]].find((l) => !s.guessed.includes(l))!;

export const solverMove = (s: HangmanState) => bestLetter(s).letter;

class HangmanAgent implements Agent<HangmanState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: HangmanState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<HangmanState, string>,
    s: HangmanState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<HangmanState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any unused letter.', es: 'Prueba cualquier letra sin usar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'frequency',
    kind: 'heuristic',
    label: { en: 'Letter frequency', es: 'Frecuencia de letras' },
    description: {
      en: 'Guesses letters from the most to the least common in the language, ignoring the word.',
      es: 'Prueba las letras de la más a la menos común del idioma, sin mirar la palabra.',
    },
    create: () => new HangmanAgent('frequency', 'Letter frequency', frequencyMove),
  },
  {
    id: 'solver',
    kind: 'search',
    label: { en: 'Word-list solver', es: 'Solucionador con lista' },
    description: {
      en: 'Keeps the listed words that still fit and guesses the letter most of them contain.',
      es: 'Conserva las palabras de la lista que aún encajan y prueba la letra que más contienen.',
    },
    create: () => new HangmanAgent('solver', 'Word-list solver', solverMove),
  },
];
