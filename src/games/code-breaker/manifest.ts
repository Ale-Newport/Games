import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'code-breaker',
  number: 118,
  title: { en: 'Code Breaker', es: 'Descifra el código' },
  tagline: {
    en: 'Crack a hidden code of colored pegs from solid and hollow scores, or set one for a minimax AI.',
    es: 'Descifra un código oculto de clavijas de colores con respuestas llenas y huecas, o pon uno a una IA minimax.',
  },
  description: {
    en: 'The classic code-breaking deduction game with original pegs: guess the hidden colors and read the score — solid for right color and place, hollow for right color elsewhere. Easy, Classic and Hard codes, a daily code, warnings when a guess contradicts what you know, hints that count the codes still possible, and an AI that cracks your own code using Knuth’s minimax method.',
    es: 'El clásico juego de deducción de descifrar códigos, con clavijas originales: adivina los colores ocultos y lee la respuesta — llena para color y sitio correctos, hueca para color correcto en otro sitio. Códigos fácil, clásico y difícil, código del día, avisos cuando un intento contradice lo que sabes, pistas que cuentan los códigos aún posibles y una IA que descifra tu propio código con el método minimax de Knuth.',
  },
  category: 'puzzle',
  genre: { en: 'Deduction', es: 'Deducción' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['code', 'deduction', 'logic', 'colors', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Cracked', es: 'Descifrado' },
      description: { en: 'Crack a code.', es: 'Descifra un código.' },
    },
    {
      id: 'four',
      title: { en: 'Four Moves', es: 'En cuatro' },
      description: {
        en: 'Crack a Classic code in four guesses or fewer.',
        es: 'Descifra un código Clásico en cuatro intentos o menos.',
      },
    },
    {
      id: 'win-hard',
      title: { en: 'Safecracker', es: 'Revientacajas' },
      description: { en: 'Crack a Hard code.', es: 'Descifra un código Difícil.' },
    },
    {
      id: 'sharp',
      title: { en: 'Airtight', es: 'Sin fisuras' },
      description: {
        en: 'Crack a code without hints, every guess fitting all the earlier scores.',
        es: 'Descifra un código sin pistas, con cada intento coherente con todas las respuestas anteriores.',
      },
    },
    {
      id: 'stump',
      title: { en: 'Tough Nut', es: 'Hueso duro' },
      description: {
        en: 'Set a code the AI needs five or more guesses to crack.',
        es: 'Pon un código que la IA necesite cinco intentos o más para descifrar.',
      },
    },
  ],
};
