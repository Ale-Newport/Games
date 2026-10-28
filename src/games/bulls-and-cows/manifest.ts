import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'bulls-and-cows',
  number: 119,
  title: { en: 'Bulls and Cows', es: 'Toros y vacas' },
  tagline: {
    en: 'Crack a secret number from bulls and cows, or race the computer to crack each other’s.',
    es: 'Descifra un número secreto con toros y vacas, o compite con el ordenador por descifrar el del otro.',
  },
  description: {
    en: 'The classic pencil-and-paper number deduction game: guess a number of different digits and read the bulls (right digit, right place) and cows (right digit, wrong place). Crack the computer’s number in 3, 4 or 5 digits, try today’s number, or duel an easy, medium or hard computer that cracks yours in turn. Notes on each digit, contradiction warnings and hints that count the numbers still possible.',
    es: 'El clásico juego de deducción de lápiz y papel: prueba un número de cifras distintas y lee los toros (cifra correcta en su sitio) y las vacas (cifra correcta en otro sitio). Descifra el número del ordenador con 3, 4 o 5 cifras, prueba el número del día o reta en duelo a un ordenador fácil, medio o difícil que descifra el tuyo por turnos. Notas en cada cifra, avisos de contradicción y pistas que cuentan los números aún posibles.',
  },
  category: 'puzzle',
  genre: { en: 'Deduction', es: 'Deducción' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Guesses', es: 'Intentos' }, lowerIsBetter: true },
  tags: ['numbers', 'deduction', 'logic', 'duel', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Bullseye', es: 'Al toro' },
      description: { en: 'Crack a number.', es: 'Descifra un número.' },
    },
    {
      id: 'quick',
      title: { en: 'Quick Herd', es: 'Rebaño rápido' },
      description: {
        en: 'Crack a 4-digit number in five guesses or fewer.',
        es: 'Descifra un número de 4 cifras en cinco intentos o menos.',
      },
    },
    {
      id: 'five',
      title: { en: 'Five Alive', es: 'Cinco de cinco' },
      description: { en: 'Crack a 5-digit number.', es: 'Descifra un número de 5 cifras.' },
    },
    {
      id: 'duel-win',
      title: { en: 'Duelist', es: 'Duelista' },
      description: { en: 'Win a duel against the computer.', es: 'Gana un duelo al ordenador.' },
    },
    {
      id: 'duel-hard',
      title: { en: 'Matador', es: 'Matador' },
      description: {
        en: 'Win a duel against the hard computer.',
        es: 'Gana un duelo al ordenador difícil.',
      },
    },
  ],
};
