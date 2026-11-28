import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hex-isles',
  number: 247,
  title: { en: 'Hex Isles', es: 'Islas hexagonales' },
  tagline: {
    en: 'Settle an island of numbered hexes, build and trade, and reach ten points first.',
    es: 'Coloniza una isla de hexágonos numerados, construye y comercia, y llega antes a diez puntos.',
  },
  description: {
    en: 'A resource-trading settlement game for 3 or 4 players on a new random island every game: groves, reefs, salt pans, lagoons and iron cliffs pay wood, coral, salt, fish and iron to the huts and towns on their corners whenever the dice roll their number. Build paths, huts and towns, buy sea charts (captains, road works, bounty, embargo, relics), trade with the bank, harbours and the other players, dodge the storm a seven brings, and race for the longest trail and the grand fleet. Play against settler or strategist computer players, or everyone on one device.',
    es: 'Un juego de colonización y comercio para 3 o 4 jugadores en una isla aleatoria nueva cada partida: arboledas, arrecifes, salinas, lagunas y acantilados de hierro pagan madera, coral, sal, pescado y hierro a las chozas y pueblos de sus esquinas cada vez que los dados sacan su número. Construye caminos, chozas y pueblos, compra cartas de navegación (capitanes, obras, botín, embargo, reliquias), comercia con la banca, los puertos y los demás, esquiva la tormenta que trae el siete y compite por la ruta más larga y la gran flota. Juega contra colonos o estrategas del ordenador, o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Settlement and trading', es: 'Colonización y comercio' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 45,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['board', 'trading', 'dice', 'building', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Island Founder', es: 'Fundador de la isla' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'strategist-win',
      title: { en: 'Master of the Isles', es: 'Señor de las islas' },
      description: { en: 'Beat the strategists.', es: 'Vence a los estrategas.' },
    },
    {
      id: 'towns',
      title: { en: 'Four Towns', es: 'Cuatro pueblos' },
      description: { en: 'Have four towns on the island.', es: 'Ten cuatro pueblos en la isla.' },
    },
    {
      id: 'trail',
      title: { en: 'Trailblazer', es: 'Pionero' },
      description: { en: 'Hold the longest trail.', es: 'Consigue la ruta más larga.' },
    },
    {
      id: 'fleet',
      title: { en: 'Admiral', es: 'Almirante' },
      description: { en: 'Hold the grand fleet.', es: 'Consigue la gran flota.' },
    },
  ],
};
