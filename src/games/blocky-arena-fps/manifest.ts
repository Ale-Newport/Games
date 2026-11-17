import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'blocky-arena-fps',
  number: 222,
  title: { en: 'Blocky Arena', es: 'Arena de bloques' },
  tagline: {
    en: 'A fast first-person free-for-all in blocky arenas, against bots.',
    es: 'Un shooter en primera persona todos contra todos en arenas de bloques, contra bots.',
  },
  description: {
    en: 'A browser arena shooter in 3D: slide, chain jumps and aim down sights with an automatic rifle, a scoped sniper or a pistol. Race 3 to 7 bots of three skill levels to the kill goal on two original arenas, with headshots, health regeneration, a kill feed and a scoreboard. Mouse and keyboard with pointer lock, or touch controls.',
    es: 'Un shooter de arena en 3D en el navegador: deslízate, encadena saltos y apunta con fusil automático, francotirador con mira o pistola. Compite con 3 a 7 bots de tres niveles por llegar antes a las bajas en dos arenas originales, con disparos a la cabeza, regeneración de vida, registro de bajas y marcador. Ratón y teclado con captura del puntero, o controles táctiles.',
  },
  category: 'viral',
  genre: { en: 'Shooter', es: 'Disparos' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Kills', es: 'Bajas' } },
  tags: ['shooter', '3d', 'real-time', 'fps', 'vs-ai'],
  achievements: [
    {
      id: 'first-blood',
      title: { en: 'First Blood', es: 'Primera sangre' },
      description: { en: 'Get a kill.', es: 'Consigue una baja.' },
    },
    {
      id: 'win',
      title: { en: 'Top Fragger', es: 'Máximo anotador' },
      description: { en: 'Win a match.', es: 'Gana una partida.' },
    },
    {
      id: 'win-hard',
      title: { en: 'Arena Champion', es: 'Campeón de la arena' },
      description: { en: 'Win against hard bots.', es: 'Gana contra bots difíciles.' },
    },
    {
      id: 'headhunter',
      title: { en: 'Headhunter', es: 'Cazacabezas' },
      description: {
        en: 'Five headshot kills in one match.',
        es: 'Cinco bajas a la cabeza en una partida.',
      },
    },
    {
      id: 'streak-5',
      title: { en: 'Rampage', es: 'Racha imparable' },
      description: { en: 'Five kills without dying.', es: 'Cinco bajas sin morir.' },
    },
    {
      id: 'marksman-win',
      title: { en: 'One Shot', es: 'Un disparo' },
      description: { en: 'Win a match as the Marksman.', es: 'Gana una partida como Tirador.' },
    },
  ],
};
