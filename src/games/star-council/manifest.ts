import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'star-council',
  number: 253,
  title: { en: 'Star Council', es: 'Consejo estelar' },
  tagline: {
    en: 'Pick strategies, move fleets, claim worlds and sway the council of a galaxy of your own.',
    es: 'Elige estrategias, mueve flotas, reclama mundos y gánate al consejo de una galaxia propia.',
  },
  description: {
    en: 'A galactic strategy game for 2 to 4 players on a hex galaxy of 37 systems dealt anew each game around the Nexus. Six invented factions, each with its own home and ability. Each round pick strategy cards (Command, Accord, Commerce, Industry, Research, Dominion), then take actions: activate a system to move ships in, fight space battles with dice, land infantry, build at your docks; or play a card whose secondary the others may follow. Score public objectives, hold the Nexus, research eight technologies and vote on twelve council agendas. First to 7 or 10 points wins. Play against envoys or regents, or everyone on one device.',
    es: 'Un juego de estrategia galáctica para 2 a 4 jugadores en una galaxia hexagonal de 37 sistemas que se reparte de nuevo en cada partida alrededor del Nexo. Seis facciones inventadas, cada una con su sistema natal y su habilidad. Cada ronda elige cartas de estrategia (Mando, Concordia, Comercio, Industria, Investigación, Dominio) y después actúa: activa un sistema para mover naves, libra batallas espaciales con dados, desembarca infantería, construye en tus muelles; o juega una carta cuya secundaria pueden seguir los demás. Puntúa objetivos públicos, retén el Nexo, investiga ocho tecnologías y vota doce propuestas del consejo. Gana quien llegue antes a 7 o 10 puntos. Juega contra enviados o regentes, o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Galactic strategy', es: 'Estrategia galáctica' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 5,
  sessionMinutes: 60,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['board', 'space', 'strategy', '4x', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Among Stars', es: 'Primero entre estrellas' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'regent-win',
      title: { en: 'Regent Slayer', es: 'Azote de regentes' },
      description: { en: 'Beat the regents.', es: 'Vence a los regentes.' },
    },
    {
      id: 'nexus',
      title: { en: 'Seat of Power', es: 'Sede del poder' },
      description: { en: 'Hold the Nexus.', es: 'Ten el Nexo.' },
    },
    {
      id: 'scholar',
      title: { en: 'Scholar', es: 'Erudito' },
      description: { en: 'Own four technologies.', es: 'Ten cuatro tecnologías.' },
    },
    {
      id: 'elected',
      title: { en: 'Voice of the Council', es: 'Voz del consejo' },
      description: {
        en: 'Be elected by the council.',
        es: 'Sé elegido por el consejo.',
      },
    },
  ],
};
