import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'backgammon',
  number: 141,
  title: { en: 'Backgammon', es: 'Backgammon' },
  tagline: {
    en: 'The classic race game of dice and checkers, with hitting, priming and the doubling cube.',
    es: 'El clásico juego de carrera con dados y fichas, con golpes, primas y el cubo de doblaje.',
  },
  description: {
    en: 'Full backgammon: entering from the bar, hitting blots, bearing off, gammons and backgammons, the doubling cube and the Crawford rule in matches to 1, 3 or 5 points. Play the computer at two strengths — a greedy player or an expectimax player that weighs every reply of the dice — or a friend on the same device, with hints, a pip count and one-die-at-a-time moves you can take back.',
    es: 'Backgammon completo: entrar desde la barra, golpear fichas solas, sacar fichas, gammon y backgammon, el cubo de doblaje y la regla Crawford en encuentros a 1, 3 o 5 puntos. Juega contra el ordenador en dos niveles —un jugador voraz o uno expectimax que pondera cada respuesta de los dados— o contra alguien en el mismo dispositivo, con pistas, recuento de pips y movimientos dado a dado que se pueden deshacer.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Match margin', es: 'Margen del encuentro' } },
  tags: ['dice', 'race', 'classic', 'two-player', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Borne Off', es: 'Todas fuera' },
      description: {
        en: 'Win a match against the computer.',
        es: 'Gana un encuentro contra el ordenador.',
      },
    },
    {
      id: 'gammon',
      title: { en: 'Gammon!', es: '¡Gammon!' },
      description: {
        en: 'Win a gammon or a backgammon against the computer.',
        es: 'Gana con gammon o backgammon contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Against the Odds', es: 'Contra pronóstico' },
      description: {
        en: 'Win a match against the hard computer.',
        es: 'Gana un encuentro contra el ordenador difícil.',
      },
    },
    {
      id: 'long',
      title: { en: 'Five-Point Match', es: 'Encuentro a cinco' },
      description: {
        en: 'Win a 5-point match against the computer.',
        es: 'Gana un encuentro a 5 puntos contra el ordenador.',
      },
    },
  ],
};
