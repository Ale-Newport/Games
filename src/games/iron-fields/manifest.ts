import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'iron-fields',
  number: 256,
  title: { en: 'Iron Fields', es: 'Campos de hierro' },
  tagline: {
    en: 'Workers, mechs and a race for stars across a contested land.',
    es: 'Obreros, robots y una carrera por las estrellas en una tierra disputada.',
  },
  description: {
    en: 'An engine-building and area-control game for 2 to 4 players on a land of 37 spaces dealt anew each game. Five invented factions, each with its own power and ability, play on four boards that pair the top actions (move, trade, produce, bolster) with the bottom ones (upgrade, deploy, build, enlist) differently. Pick a section other than last turn’s, take its top action and pay for its bottom one; grow your workforce, deploy four mechs that unlock abilities, build structures, enlist recruits, meet encounters, claim the Foundry and fight with secret power bids. Achievements earn stars; at the fifth star the game ends and coins are counted — your own plus stars, territories and resources, paid at the rate your popularity allows. Play against recruits or marshals, or everyone on one device.',
    es: 'Un juego de construcción de motores y control de territorio para 2 a 4 jugadores en una tierra de 37 espacios que se reparte de nuevo en cada partida. Cinco facciones inventadas, cada una con su poder y su habilidad, juegan en cuatro tableros que emparejan de forma distinta las acciones superiores (mover, comerciar, producir, reforzar) con las inferiores (mejorar, desplegar, construir, reclutar). Elige una sección distinta de la del turno anterior, haz su acción superior y paga la inferior; haz crecer tu mano de obra, despliega cuatro robots que desbloquean habilidades, construye edificios, recluta, vive encuentros, alcanza la Fundición y combate con pujas de poder secretas. Los logros dan estrellas; con la quinta acaba la partida y se cuentan las monedas: las tuyas más estrellas, territorios y recursos, pagados según tu popularidad. Juega contra reclutas o mariscales, o todos en un mismo dispositivo.',
  },
  category: 'tabletop',
  genre: { en: 'Engine building and area control', es: 'Motores y control de territorio' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 5,
  sessionMinutes: 50,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Coins', es: 'Monedas' } },
  tags: ['board', 'engine-building', 'area-control', 'war', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Iron Will', es: 'Voluntad de hierro' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'marshal-win',
      title: { en: 'Outmarshalled', es: 'Más mariscal que nadie' },
      description: { en: 'Beat the marshals.', es: 'Vence a los mariscales.' },
    },
    {
      id: 'victor',
      title: { en: 'Victor', es: 'Vencedor' },
      description: { en: 'Win a fight.', es: 'Gana un combate.' },
    },
    {
      id: 'foundry',
      title: { en: 'At the Foundry', es: 'En la Fundición' },
      description: {
        en: 'Reach the Foundry with your character.',
        es: 'Llega a la Fundición con tu personaje.',
      },
    },
    {
      id: 'mechs',
      title: { en: 'Full Hangar', es: 'Hangar completo' },
      description: { en: 'Deploy all four mechs.', es: 'Despliega los cuatro robots.' },
    },
  ],
};
