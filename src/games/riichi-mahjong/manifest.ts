import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'riichi-mahjong',
  number: 160,
  title: { en: 'Riichi Mahjong', es: 'Mahjong riichi' },
  tagline: {
    en: 'Four sets and a pair, at least one yaku: draw, discard, call and declare riichi against three computer players.',
    es: 'Cuatro grupos y una pareja con al menos un yaku: roba, descarta, canta y declara riichi contra tres rivales.',
  },
  description: {
    en: 'Four-player Japanese mahjong, an East-only game from 25 000 points: chi, pon and kan calls, riichi, furiten, dora and ura-dora, the common yaku and yakuman, fu and han scoring with honba and riichi sticks, and exhaustive draws. Your opponents count shanten and tile acceptance, and the careful ones fold against riichi; hints explain each suggestion.',
    es: 'Mahjong japonés a cuatro, una partida de solo Este desde 25 000 puntos: chi, pon y kan, riichi, furiten, dora y ura-dora, los yaku y yakuman habituales, puntuación por han y fu con honba y palos de riichi, y empates por agotamiento del muro. Tus rivales cuentan shanten y aceptación de fichas, y los prudentes se retiran ante un riichi; las pistas explican cada sugerencia.',
  },
  category: 'dice',
  genre: { en: 'Tile game', es: 'Juego de fichas' },
  players: { min: 4, max: 4 },
  vsComputer: true,
  complexity: 5,
  sessionMinutes: 30,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['mahjong', 'tiles', 'hidden-information', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'East Wind', es: 'Viento del Este' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'podium',
      title: { en: 'Top Two', es: 'Entre los dos primeros' },
      description: { en: 'Finish first or second.', es: 'Termina primero o segundo.' },
    },
    {
      id: 'top',
      title: { en: 'Table Leader', es: 'Líder de la mesa' },
      description: { en: 'Finish first.', es: 'Termina primero.' },
    },
    {
      id: 'mangan',
      title: { en: 'Mangan', es: 'Mangan' },
      description: {
        en: 'Win a hand worth a mangan or more.',
        es: 'Gana una mano de mangan o más.',
      },
    },
  ],
};
