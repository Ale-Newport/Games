import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'boulder-dig',
  number: 188,
  title: { en: 'Gem Digger', es: 'Excavagemas' },
  tagline: {
    en: 'Dig for gems under a cave full of falling boulders.',
    es: 'Excava en busca de gemas bajo una cueva llena de rocas que caen.',
  },
  description: {
    en: 'A cave-digging game with an original name and look: tunnel through earth, collect gems and push boulders, while boulders and gems fall and roll whenever nothing holds them. Sparks and moths roam the pockets — drop a boulder on a moth and it turns into gems. Gather enough gems to open the exit before the time runs out; each cave is generated from the run’s seed. Arrows or the touch pad (or hold a finger towards where to dig); watch an AI miner that plays the cave forward before every move.',
    es: 'Un juego de excavar cuevas con nombre y aspecto originales: abre túneles en la tierra, recoge gemas y empuja rocas, mientras las rocas y las gemas caen y ruedan en cuanto nada las sujeta. Por los huecos rondan chispas y polillas: deja caer una roca sobre una polilla y se convierte en gemas. Reúne gemas suficientes para abrir la salida antes de que se acabe el tiempo; cada cueva se genera a partir de la semilla de la partida. Flechas o el panel táctil (o mantén un dedo hacia donde excavar); mira a un minero de la IA que adelanta la cueva antes de cada paso.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'digging', 'physics'],
  achievements: [
    {
      id: 'exit',
      title: { en: 'Way Out', es: 'La salida' },
      description: { en: 'Leave a cave through its exit.', es: 'Sal de una cueva por su salida.' },
    },
    {
      id: 'moth',
      title: { en: 'Gem Alchemy', es: 'Alquimia de gemas' },
      description: {
        en: 'Turn a moth into gems with a boulder.',
        es: 'Convierte una polilla en gemas con una roca.',
      },
    },
    {
      id: 'deep',
      title: { en: 'Deep Digger', es: 'Excavador profundo' },
      description: { en: 'Reach cave 4.', es: 'Llega a la cueva 4.' },
    },
    {
      id: 'score',
      title: { en: 'Gem Hoard', es: 'Tesoro de gemas' },
      description: { en: 'Score 2000 points.', es: 'Consigue 2000 puntos.' },
    },
  ],
};
