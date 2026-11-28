import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'global-front',
  number: 252,
  title: { en: 'Global Front', es: 'Frente global' },
  tagline: {
    en: 'Lead an alliance of two powers: build armies, fleets and air power, and take the world’s victory cities.',
    es: 'Dirige una alianza de dos potencias: crea ejércitos, flotas y aviación, y toma las ciudades de la victoria.',
  },
  description: {
    en: 'A grand-strategy war game for 1 or 2 players on the invented world of Meridian: four powers in two alliances, 26 territories and 7 seas. Each power buys infantry, artillery, armour, fighters, bombers, transports, cruisers and battleships with its income, attacks by land, sea and air (landing troops from transports), fights battles with dice — artillery supports infantry, battleships take two hits — then moves, places new units at its factories and collects income. Hold nine of the twelve victory cities to win. Play against colonel or general computer opponents, or two players on one device.',
    es: 'Un juego de gran estrategia bélica para 1 o 2 jugadores en el mundo inventado de Meridia: cuatro potencias en dos alianzas, 26 territorios y 7 mares. Cada potencia compra infantería, artillería, blindados, cazas, bombarderos, transportes, cruceros y acorazados con sus ingresos, ataca por tierra, mar y aire (desembarcando tropas desde transportes), libra batallas con dados —la artillería apoya a la infantería, los acorazados aguantan dos impactos— y después mueve, coloca unidades nuevas en sus fábricas y cobra. Gana quien tenga nueve de las doce ciudades de la victoria. Juega contra coroneles o generales del ordenador, o dos jugadores en un dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Grand strategy', es: 'Gran estrategia' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 60,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Victory cities', es: 'Ciudades de la victoria' } },
  tags: ['board', 'war', 'strategy', 'dice', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Victory', es: 'Victoria' },
      description: {
        en: 'Win a war against the computer.',
        es: 'Gana una guerra contra el ordenador.',
      },
    },
    {
      id: 'general-win',
      title: { en: 'Field Marshal', es: 'Mariscal de campo' },
      description: { en: 'Beat the generals.', es: 'Vence a los generales.' },
    },
    {
      id: 'first-capture',
      title: { en: 'Breakthrough', es: 'Avance' },
      description: { en: 'Take an enemy territory.', es: 'Toma un territorio enemigo.' },
    },
    {
      id: 'capital',
      title: { en: 'Fall of a Capital', es: 'Caída de una capital' },
      description: { en: 'Take an enemy capital.', es: 'Toma una capital enemiga.' },
    },
  ],
};
