import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'code-words',
  number: 215,
  title: { en: 'Code Words', es: 'Palabras clave' },
  tagline: {
    en: 'One word, one number: lead your team to its agents — and away from the assassin.',
    es: 'Una palabra, un número: guía a tu equipo hasta sus agentes, lejos del asesino.',
  },
  description: {
    en: 'The team word-association game: 25 code words, nine red agents, eight blue, seven bystanders and one assassin. Play the red operative guessing from your bot spymaster’s clues, or the spymaster who sees the key and gives one-word clues to a bot operative — against a rival bot team that reads meaning from word vectors. Three rival skill levels and a mode to watch the bots play.',
    es: 'El juego de asociación de palabras por equipos: 25 palabras clave, nueve agentes rojos, ocho azules, siete transeúntes y un asesino. Juega como agente rojo adivinando con las pistas de tu jefe bot, o como jefe de espías que ve la clave y da pistas de una palabra a un agente bot, contra un equipo rival de bots que entiende el significado con vectores de palabras. Tres niveles de rival y un modo para ver jugar a los bots.',
  },
  category: 'viral',
  genre: { en: 'Word / party', es: 'Palabras / fiesta' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 12,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['codenames', 'spymaster', 'words', 'association', 'teams', 'party'],
  achievements: [
    {
      id: 'operative-win',
      title: { en: 'Field Agent', es: 'Agente de campo' },
      description: { en: 'Win as the operative.', es: 'Gana como agente.' },
    },
    {
      id: 'spymaster-win',
      title: { en: 'Master of Clues', es: 'Maestro de pistas' },
      description: { en: 'Win as the spymaster.', es: 'Gana como jefe de espías.' },
    },
    {
      id: 'rout',
      title: { en: 'Rout', es: 'Paliza' },
      description: {
        en: 'Win with five or more blue agents still hidden.',
        es: 'Gana con cinco o más agentes azules aún ocultos.',
      },
    },
    {
      id: 'four-clues',
      title: { en: 'Four Clues', es: 'Cuatro pistas' },
      description: {
        en: 'Win with four red clues or fewer.',
        es: 'Gana con cuatro pistas rojas o menos.',
      },
    },
  ],
};
