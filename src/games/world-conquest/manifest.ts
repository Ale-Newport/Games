import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'world-conquest',
  number: 248,
  title: { en: 'World Conquest', es: 'Conquista mundial' },
  tagline: {
    en: 'Mass your armies, roll for every border and hold whole landmasses — last empire standing wins.',
    es: 'Reúne tus ejércitos, lucha a los dados por cada frontera y domina continentes enteros: gana el último imperio en pie.',
  },
  description: {
    en: 'A territory-conquest strategy game for 2 to 5 players on an invented world of six landmasses and 36 territories. Deal out the map, place your armies, then each turn reinforce (more for whole landmasses and card sets), attack with up to three dice against two, move in, and make one fortifying move. Earn a card for every turn with a conquest and trade sets for ever more armies; knock a player out to take their cards. Play against general or marshal computer players — the marshal weighs the exact odds of every battle — or everyone on one device.',
    es: 'Un juego de estrategia y conquista de territorios para 2 a 5 jugadores en un mundo inventado de seis continentes y 36 territorios. Reparte el mapa, coloca tus ejércitos y, en cada turno, refuerza (más si dominas continentes enteros o cambias tríos de cartas), ataca con hasta tres dados contra dos, ocupa lo conquistado y haz un movimiento de refuerzo. Gana una carta en cada turno con alguna conquista y cambia tríos por cada vez más ejércitos; elimina a un rival para quedarte sus cartas. Juega contra generales o mariscales del ordenador —el mariscal calcula las probabilidades exactas de cada batalla— o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Territory conquest', es: 'Conquista de territorios' },
  players: { min: 1, max: 5 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 40,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Territories', es: 'Territorios' } },
  tags: ['board', 'war', 'dice', 'strategy', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'World Conqueror', es: 'Conquistador del mundo' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'marshal-win',
      title: { en: 'Outgeneralled', es: 'Superados en estrategia' },
      description: { en: 'Beat the marshals.', es: 'Vence a los mariscales.' },
    },
    {
      id: 'crowded',
      title: { en: 'Crowded World', es: 'Mundo abarrotado' },
      description: {
        en: 'Win a game of four or five players.',
        es: 'Gana una partida de cuatro o cinco jugadores.',
      },
    },
    {
      id: 'landmass',
      title: { en: 'Continental', es: 'Continental' },
      description: { en: 'Hold a whole landmass.', es: 'Domina un continente entero.' },
    },
    {
      id: 'knockout',
      title: { en: 'Knockout', es: 'Fuera de combate' },
      description: { en: 'Knock a player out.', es: 'Elimina a un jugador.' },
    },
  ],
};
