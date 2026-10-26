import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'gin-rummy',
  number: 96,
  title: { en: 'Gin Rummy', es: 'Gin Rummy' },
  tagline: {
    en: 'Runs, sets and deadwood: knock early or hold out for gin against an AI that reads your picks.',
    es: 'Escaleras, grupos y madera: llama pronto o aguanta hasta el gin contra una IA que se fija en lo que recoges.',
  },
  description: {
    en: 'The two-player rummy classic: draw, discard, form runs and sets, and knock when your deadwood is 10 or less — or go gin. Watch out for undercuts. The Hard opponent looks a draw ahead and estimates your possible hands before it knocks. First to 100 points wins.',
    es: 'El clásico rummy para dos: roba, descarta, forma escaleras y grupos y llama cuando tu madera sea 10 o menos, o haz gin. Cuidado con los undercuts. El rival difícil mira un robo por delante y estima tus manos posibles antes de llamar. Gana el primero que llegue a 100 puntos.',
  },
  category: 'cards',
  genre: { en: 'Rummy', es: 'Rummy' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Winning margin', es: 'Margen de victoria' } },
  tags: ['rummy', 'gin', 'cards', 'melds'],
  achievements: [
    {
      id: 'knock',
      title: { en: 'Knock Knock', es: 'Toc toc' },
      description: { en: 'Win a hand by knocking.', es: 'Gana una mano llamando.' },
    },
    {
      id: 'gin',
      title: { en: 'Gin!', es: '¡Gin!' },
      description: { en: 'Go gin.', es: 'Haz gin.' },
    },
    {
      id: 'undercut',
      title: { en: 'Undercut', es: 'Undercut' },
      description: { en: 'Undercut a knock.', es: 'Haz un undercut a una llamada.' },
    },
    {
      id: 'match',
      title: { en: 'Century', es: 'Centenar' },
      description: { en: 'Win a match to 100.', es: 'Gana una partida a 100.' },
    },
    {
      id: 'match-hard',
      title: { en: 'Rummy Master', es: 'Maestro del rummy' },
      description: { en: 'Win a match against Hard.', es: 'Gana una partida contra Difícil.' },
    },
  ],
};
