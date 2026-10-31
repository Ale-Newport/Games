import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'block-dominoes',
  number: 156,
  title: { en: 'Block Dominoes', es: 'Dominó de bloqueo' },
  tagline: {
    en: 'The classic draw-less domino game: match the ends, pass when stuck, and go out first.',
    es: 'El dominó clásico sin robar: casa los extremos, pasa si no puedes y quédate sin fichas antes.',
  },
  description: {
    en: 'Double-six dominoes for 2–4 players with seven tiles each and no drawing: play a tile that matches an open end of the line or pass. The player who goes out scores every other hand’s pips; when nobody can play, the lowest hand scores the difference. First to 50 wins. Computer players either shed heavy tiles or play out every option in deals of the tiles they cannot see.',
    es: 'Dominó doble seis para 2–4 jugadores con siete fichas cada uno y sin robar: juega una ficha que case con un extremo abierto o pasa. Quien se queda sin fichas se apunta los puntos de las demás manos; si nadie puede jugar, la mano más baja se apunta la diferencia. Gana quien llegue a 50. Los rivales sueltan fichas pesadas o juegan cada opción en repartos de las fichas que no ven.',
  },
  category: 'dice',
  genre: { en: 'Dominoes', es: 'Dominó' },
  players: { min: 2, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['dominoes', 'tiles', 'hidden-information', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Clean Sweep', es: 'Barrida limpia' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Bone Master', es: 'Maestro del hueso' },
      description: { en: 'Beat hard computer players.', es: 'Vence a rivales difíciles.' },
    },
    {
      id: 'four',
      title: { en: 'Full Table', es: 'Mesa completa' },
      description: { en: 'Win a four-player game.', es: 'Gana una partida a cuatro.' },
    },
    {
      id: 'shutout',
      title: { en: 'Shutout', es: 'Paliza' },
      description: {
        en: 'Win before any opponent scores.',
        es: 'Gana sin que ningún rival puntúe.',
      },
    },
  ],
};
