import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'euchre',
  number: 98,
  title: { en: 'Euchre', es: 'Euchre' },
  tagline: {
    en: 'Order up trump, mind the bowers, take three tricks with your AI partner — first to 10.',
    es: 'Pide triunfo, vigila los bowers y gana tres bazas con tu compañero de IA: el primero a 10.',
  },
  description: {
    en: 'The fast partnership trick-taking game with a 24-card deck: call trump from the turned card or name a suit, take at least three of five tricks, or go alone for a bigger score. The two jacks of trump colour rank on top. The Hard players play by simulating deals of the cards they cannot see.',
    es: 'El rápido juego de bazas por parejas con una baraja de 24 cartas: haz triunfo con la carta vuelta o nombra un palo, gana al menos tres de cinco bazas o juega solo para sumar más. Las dos jotas del color del triunfo mandan. Los jugadores difíciles juegan simulando repartos de las cartas que no ven.',
  },
  category: 'cards',
  genre: { en: 'Trick-taking', es: 'Bazas' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Winning margin', es: 'Margen de victoria' } },
  tags: ['euchre', 'trick-taking', 'partnership', 'cards'],
  achievements: [
    {
      id: 'maker',
      title: { en: 'Trump Maker', es: 'Hacer triunfo' },
      description: {
        en: 'Make trump yourself and take the hand.',
        es: 'Haz tú el triunfo y gana la mano.',
      },
    },
    {
      id: 'march',
      title: { en: 'March', es: 'Las cinco' },
      description: {
        en: 'Take all five tricks as makers.',
        es: 'Gana las cinco bazas haciendo triunfo.',
      },
    },
    {
      id: 'alone',
      title: { en: 'Lone Wolf', es: 'Lobo solitario' },
      description: { en: 'Go alone and take all five.', es: 'Juega solo y gana las cinco.' },
    },
    {
      id: 'euchre',
      title: { en: 'Euchred!', es: '¡Euchre!' },
      description: { en: 'Euchre the other side.', es: 'Haz fallar a la otra pareja.' },
    },
    {
      id: 'win-game',
      title: { en: 'Ten', es: 'Diez' },
      description: { en: 'Win a game.', es: 'Gana una partida.' },
    },
    {
      id: 'win-hard',
      title: { en: 'Right Bower', es: 'Bower derecho' },
      description: { en: 'Win a game at Hard.', es: 'Gana una partida en Difícil.' },
    },
  ],
};
