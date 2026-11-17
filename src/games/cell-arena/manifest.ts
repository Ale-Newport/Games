import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'cell-arena',
  number: 221,
  title: { en: 'Cell Arena', es: 'Arena de células' },
  tagline: {
    en: 'Eat or be eaten: grow your cell, split to strike, hide behind viruses.',
    es: 'Come o te comen: haz crecer tu célula, divídete para atacar, escóndete tras los virus.',
  },
  description: {
    en: 'A giant petri dish shared with 10 to 25 computer cells. Swallow pellets and anything 25 % smaller than you, split to catch prey, eject mass, and beware the spiky viruses that burst big cells. A live leaderboard ranks everyone by mass; bots graze, flee and hunt with split attacks on harder levels.',
    es: 'Una placa de Petri gigante compartida con 10 a 25 células del ordenador. Trágate bolitas y todo lo que sea un 25 % más pequeño que tú, divídete para cazar, expulsa masa y cuidado con los virus con pinchos que revientan a las células grandes. Una clasificación en directo ordena a todos por masa; los bots pastan, huyen y, en los niveles difíciles, cazan dividiéndose.',
  },
  category: 'viral',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Best mass', es: 'Mejor masa' } },
  tags: ['arcade', 'real-time', 'io', 'vs-ai'],
  achievements: [
    {
      id: 'mass-200',
      title: { en: 'Growing Cell', es: 'Célula en crecimiento' },
      description: { en: 'Reach a mass of 200.', es: 'Llega a una masa de 200.' },
    },
    {
      id: 'mass-1000',
      title: { en: 'Heavyweight', es: 'Peso pesado' },
      description: { en: 'Reach a mass of 1,000.', es: 'Llega a una masa de 1000.' },
    },
    {
      id: 'mass-3000',
      title: { en: 'Dish Dominator', es: 'Dueña de la placa' },
      description: { en: 'Reach a mass of 3,000.', es: 'Llega a una masa de 3000.' },
    },
    {
      id: 'kill',
      title: { en: 'First Bite', es: 'Primer bocado' },
      description: { en: 'Eat another player completely.', es: 'Cómete del todo a otro jugador.' },
    },
    {
      id: 'kills-5',
      title: { en: 'Apex Predator', es: 'Superdepredadora' },
      description: {
        en: 'Eat five players in one life.',
        es: 'Cómete a cinco jugadores en una vida.',
      },
    },
    {
      id: 'top',
      title: { en: 'Number One', es: 'Número uno' },
      description: { en: 'Top the leaderboard.', es: 'Encabeza la clasificación.' },
    },
  ],
};
