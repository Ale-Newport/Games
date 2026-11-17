import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'stack-duel',
  number: 219,
  title: { en: 'Stack Duel', es: 'Duelo de bloques' },
  tagline: {
    en: 'Competitive falling blocks: send garbage, race 40 lines, chase a blitz score.',
    es: 'Bloques que caen en modo competitivo: manda basura, corre 40 líneas, bate tu blitz.',
  },
  description: {
    en: 'Modern competitive stacking with hold, five-piece preview, half-turn rotation and an attack table: doubles, triples, quads, T-spins, back-to-backs, combos and all clears send garbage rows into the bot’s well, and clears cancel garbage on its way to you. Battle bots at four speeds in single rounds or first-to-two matches, race 40 lines, or score all you can in a two-minute blitz.',
    es: 'Apilado competitivo moderno con reserva, cinco piezas de vista previa, giro de media vuelta y tabla de ataque: dobles, triples, cuádruples, T-spins, seguidos, combos y pozos limpios mandan filas de basura al pozo del bot, y tus líneas anulan la basura que viene hacia ti. Enfréntate a bots de cuatro velocidades a una ronda o al mejor de tres, corre las 40 líneas o suma todo lo que puedas en un blitz de dos minutos.',
  },
  category: 'viral',
  genre: { en: 'Puzzle battle', es: 'Puzle de combate' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 4,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Lines sent / points', es: 'Líneas enviadas / puntos' } },
  tags: ['puzzle', 'real-time', 'falling-blocks', 'versus', 'vs-ai'],
  achievements: [
    {
      id: 'win',
      title: { en: 'First K.O.', es: 'Primer K.O.' },
      description: { en: 'Win a versus match.', es: 'Gana una partida de duelo.' },
    },
    {
      id: 'hard',
      title: { en: 'Ranked Up', es: 'Subida de rango' },
      description: { en: 'Beat the hard or expert bot.', es: 'Vence al bot difícil o experto.' },
    },
    {
      id: 'expert',
      title: { en: 'Top of the Ladder', es: 'Cima de la clasificación' },
      description: { en: 'Beat the expert bot.', es: 'Vence al bot experto.' },
    },
    {
      id: 'quad',
      title: { en: 'Quad', es: 'Cuádruple' },
      description: {
        en: 'Clear four lines with one piece.',
        es: 'Limpia cuatro líneas con una pieza.',
      },
    },
    {
      id: 'tspin',
      title: { en: 'Spin Doctor', es: 'Maestro del giro' },
      description: { en: 'Clear lines with a T-spin.', es: 'Limpia líneas con un T-spin.' },
    },
    {
      id: 'combo',
      title: { en: 'Chain Reaction', es: 'Reacción en cadena' },
      description: { en: 'Reach a 5 combo.', es: 'Llega a un combo de 5.' },
    },
    {
      id: 'all-clear',
      title: { en: 'Spotless', es: 'Impecable' },
      description: {
        en: 'Empty the whole well with a clear.',
        es: 'Vacía todo el pozo con una línea.',
      },
    },
    {
      id: 'sprint',
      title: { en: 'Speed Stacker', es: 'Apilador veloz' },
      description: {
        en: 'Finish 40 lines in 90 seconds or less.',
        es: 'Termina las 40 líneas en 90 segundos o menos.',
      },
    },
    {
      id: 'blitz',
      title: { en: 'Blitz Master', es: 'Maestro del blitz' },
      description: { en: 'Score 30,000 points in blitz.', es: 'Haz 30 000 puntos en blitz.' },
    },
  ],
};
