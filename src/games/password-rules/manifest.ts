import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'password-rules',
  number: 224,
  title: { en: 'Password Rules', es: 'Reglas de contraseña' },
  tagline: {
    en: 'Choose a password. Then another rule appears. And another…',
    es: 'Elige una contraseña. Luego aparece otra regla. Y otra…',
  },
  description: {
    en: 'An escalating puzzle of 28 password rules: digits that sum to 25, Roman numerals that multiply to 35, a CAPTCHA, the moon phase, a country’s outline, atomic numbers adding to 200, bold vowels, a spreading fire, and Paul — an egg you must protect, hatch and feed. Each character carries its own bold, italic, font and size.',
    es: 'Un puzle creciente de 28 reglas de contraseña: dígitos que suman 25, números romanos que multiplican 35, un CAPTCHA, la fase lunar, la silueta de un país, números atómicos que suman 200, vocales en negrita, un fuego que se extiende y Paul, un huevo que hay que proteger, ver nacer y alimentar. Cada carácter tiene su propia negrita, cursiva, fuente y tamaño.',
  },
  category: 'viral',
  genre: { en: 'Puzzle', es: 'Puzle' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 20,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Rules met', es: 'Reglas cumplidas' } },
  tags: ['puzzle', 'word', 'absurd', 'escalating'],
  achievements: [
    {
      id: 'rule-10',
      title: { en: 'Getting Picky', es: 'Cada vez más exigente' },
      description: { en: 'Reach rule 10.', es: 'Llega a la regla 10.' },
    },
    {
      id: 'paul',
      title: { en: 'Proud Parent', es: 'Padre orgulloso' },
      description: { en: 'See Paul hatch.', es: 'Mira nacer a Paul.' },
    },
    {
      id: 'fire',
      title: { en: 'Firefighter', es: 'Bombero' },
      description: { en: 'Put out the fire.', es: 'Apaga el fuego.' },
    },
    {
      id: 'win',
      title: { en: 'Password Accepted', es: 'Contraseña aceptada' },
      description: { en: 'Meet all 28 rules and confirm.', es: 'Cumple las 28 reglas y confirma.' },
    },
    {
      id: 'fast',
      title: { en: 'Quick Thinker', es: 'Mente rápida' },
      description: { en: 'Win in 15 minutes or less.', es: 'Gana en 15 minutos o menos.' },
    },
  ],
};
