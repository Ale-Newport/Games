import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'disc-soccer',
  number: 218,
  title: { en: 'Disc Soccer', es: 'Fútbol de discos' },
  tagline: {
    en: 'Physics football with round players: dribble, kick and score past the bots.',
    es: 'Fútbol con física y jugadores redondos: regatea, chuta y marca a los bots.',
  },
  description: {
    en: 'A top-down football match where every player is a sliding disc. Push the ball to dribble, hold kick to blast it, bounce passes off the walls and beat the posts. Play 1 v 1, 2 v 2 or 3 v 3 with bot teammates against bots at three levels; matches run 3 or 5 minutes (or to that many goals) with golden-goal overtime.',
    es: 'Un partido de fútbol visto desde arriba en el que cada jugador es un disco que se desliza. Empuja el balón para regatear, chuta con fuerza, haz paredes con las bandas y supera a los postes. Juega 1 contra 1, 2 contra 2 o 3 contra 3 con bots compañeros contra bots de tres niveles; los partidos duran 3 o 5 minutos (o hasta esos goles) con prórroga a gol de oro.',
  },
  category: 'viral',
  genre: { en: 'Sports', es: 'Deportes' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Goal difference', es: 'Diferencia de goles' } },
  tags: ['sports', 'physics', 'real-time', 'team', 'vs-ai'],
  achievements: [
    {
      id: 'first-goal',
      title: { en: 'Off the Mark', es: 'Estreno goleador' },
      description: { en: 'Score a goal yourself.', es: 'Marca un gol tú mismo.' },
    },
    {
      id: 'win',
      title: { en: 'Final Whistle', es: 'Pitido final' },
      description: { en: 'Win a match.', es: 'Gana un partido.' },
    },
    {
      id: 'hard',
      title: { en: 'Pro League', es: 'Liga profesional' },
      description: { en: 'Beat the hard bots.', es: 'Vence a los bots difíciles.' },
    },
    {
      id: 'clean-sheet',
      title: { en: 'Clean Sheet', es: 'Portería a cero' },
      description: { en: 'Win without conceding.', es: 'Gana sin encajar.' },
    },
    {
      id: 'hat-trick',
      title: { en: 'Hat-trick', es: 'Triplete' },
      description: {
        en: 'Score three goals yourself in one match.',
        es: 'Marca tres goles tú mismo en un partido.',
      },
    },
    {
      id: 'golden-goal',
      title: { en: 'Golden Goal', es: 'Gol de oro' },
      description: { en: 'Win a match in overtime.', es: 'Gana un partido en la prórroga.' },
    },
  ],
};
