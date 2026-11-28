import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tile-realm',
  number: 250,
  title: { en: 'Tile Realm', es: 'Reino de losetas' },
  tagline: {
    en: 'Draw a tile, fit it to the land, claim towns, roads, meadows and shrines with your wardens.',
    es: 'Saca una loseta, encájala en el paisaje y reclama villas, caminos, praderas y santuarios con tus guardianes.',
  },
  description: {
    en: 'A tile-laying game for 2 to 5 players with an original set of 69 tiles. Each turn, draw a tile and place it so that every side matches its neighbours — towns to towns, roads to roads, meadows to meadows — then perhaps stand one of your seven wardens on its town, road, meadow or shrine, if nobody holds that feature yet. Finished roads, towns and shrines score at once for whoever has most wardens on them; at the end unfinished ones score half and meadows pay for every finished town they border. Play against apprentice or master computer players, or everyone on one device.',
    es: 'Un juego de colocar losetas para 2 a 5 jugadores con un juego propio de 69 losetas. En cada turno saca una loseta y colócala de modo que cada lado case con sus vecinos —villa con villa, camino con camino, pradera con pradera— y, si quieres, pon uno de tus siete guardianes en su villa, camino, pradera o santuario si nadie lo controla aún. Caminos, villas y santuarios terminados puntúan al momento para quien tenga más guardianes en ellos; al final lo inacabado puntúa la mitad y las praderas cobran por cada villa terminada que tocan. Juega contra aprendices o maestros del ordenador, o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Tile laying', es: 'Colocación de losetas' },
  players: { min: 1, max: 5 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 30,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['board', 'tiles', 'area-control', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Realm Builder', es: 'Constructor del reino' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'master-win',
      title: { en: 'Grand Master', es: 'Gran maestro' },
      description: { en: 'Beat the masters.', es: 'Vence a los maestros.' },
    },
    {
      id: 'big-town',
      title: { en: 'Walled City', es: 'Ciudad amurallada' },
      description: {
        en: 'Finish a town of four tiles or more.',
        es: 'Termina una villa de cuatro losetas o más.',
      },
    },
    {
      id: 'shrine',
      title: { en: 'Pilgrim', es: 'Peregrino' },
      description: { en: 'Finish a shrine.', es: 'Termina un santuario.' },
    },
    {
      id: 'hundred',
      title: { en: 'Hundred Points', es: 'Cien puntos' },
      description: { en: 'Score 100 points in a game.', es: 'Consigue 100 puntos en una partida.' },
    },
  ],
};
