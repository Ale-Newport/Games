import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'planet-shapers',
  number: 254,
  title: { en: 'Planet Shapers', es: 'Modeladores de planetas' },
  tagline: {
    en: 'Warm it, wet it, let it breathe: race to shape a planet with an engine of project cards.',
    es: 'Caliéntalo, riégalo, hazlo respirar: compite por dar forma a un planeta con un motor de cartas de proyecto.',
  },
  description: {
    en: 'An engine-building game for 2 to 4 players on the invented planet Kepra. Choose one of six corporations, buy project cards each generation and play them to build production of six resources, then raise the three global parameters — heat, air and seas — with cards, standard projects and conversions. Every step raises your shaping rating, which is both income and points. Place seas in the basins, groves next to your land and settlements apart; claim milestones and fund awards. When the planet is complete the most points win. 57 original cards. Play against cadets or architects, or everyone on one device with hidden hands.',
    es: 'Un juego de construcción de motores para 2 a 4 jugadores en el planeta inventado Kepra. Elige una de seis corporaciones, compra cartas de proyecto en cada generación y juégalas para crear producción de seis recursos; después sube los tres parámetros globales —calor, aire y mares— con cartas, proyectos estándar y conversiones. Cada paso sube tu calificación de terraformación, que es a la vez ingreso y puntos. Coloca mares en las cuencas, arboledas junto a tus tierras y asentamientos separados; reclama hitos y financia premios. Cuando el planeta está completo gana quien tenga más puntos. 57 cartas originales. Juega contra cadetes o arquitectos, o todos en un mismo dispositivo con las manos ocultas.',
  },
  category: 'tabletop',
  genre: { en: 'Engine building', es: 'Construcción de motores' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 45,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['board', 'cards', 'engine-building', 'space', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Planet Shaper', es: 'Modelador de planetas' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'architect-win',
      title: { en: 'Master Plan', es: 'Plan maestro' },
      description: { en: 'Beat the architects.', es: 'Vence a los arquitectos.' },
    },
    {
      id: 'milestone',
      title: { en: 'Milestone', es: 'Hito' },
      description: { en: 'Claim a milestone.', es: 'Reclama un hito.' },
    },
    {
      id: 'gardener',
      title: { en: 'Green Thumb', es: 'Mano verde' },
      description: { en: 'Own three groves.', es: 'Ten tres arboledas.' },
    },
    {
      id: 'engine',
      title: { en: 'Well-Oiled Engine', es: 'Motor bien engrasado' },
      description: {
        en: 'Have twelve cards in play (events aside).',
        es: 'Ten doce cartas en juego (sin contar eventos).',
      },
    },
  ],
};
