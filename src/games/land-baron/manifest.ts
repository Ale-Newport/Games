import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'land-baron',
  number: 249,
  title: { en: 'Land Baron', es: 'Barón del suelo' },
  tagline: {
    en: 'Buy a harbour town lot by lot, charge rent, build on whole districts — and bankrupt everyone else.',
    es: 'Compra un pueblo portuario solar a solar, cobra alquileres, edifica en barrios completos y arruina a los demás.',
  },
  description: {
    en: 'A property-trading board game for 2 to 5 players on a 36-space harbour town of our own: buy lots, ferries and works as you land on them or win them at auction, collect rent, complete colour districts to build houses and hotels, mortgage when cash runs short, trade property and money with the other players, draw Luck and Council cards and dodge the Lockup. Play to the last player standing or a timed game won by the richest. Computer opponents range from a speculator to a baron who values every space by how often it is landed on.',
    es: 'Un juego de compraventa de propiedades para 2 a 5 jugadores en un pueblo portuario propio de 36 casillas: compra solares, ferris y talleres al caer en ellos o gánalos en subasta, cobra alquileres, completa barrios de un color para edificar casas y hoteles, hipoteca cuando falte dinero, negocia propiedades y dinero con los demás, saca cartas de Suerte y Concejo y esquiva el calabozo. Juega hasta que quede uno o una partida con tiempo que gana el más rico. Los rivales del ordenador van del especulador al barón, que valora cada casilla por lo a menudo que se cae en ella.',
  },
  category: 'tabletop',
  genre: { en: 'Property trading', es: 'Compraventa de propiedades' },
  players: { min: 1, max: 5 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 45,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Worth', es: 'Patrimonio' } },
  tags: ['board', 'economy', 'dice', 'trading', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Landlord', es: 'Casero' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'baron-win',
      title: { en: 'True Baron', es: 'Barón de verdad' },
      description: { en: 'Beat the barons.', es: 'Vence a los barones.' },
    },
    {
      id: 'district',
      title: { en: 'Whole District', es: 'Barrio entero' },
      description: { en: 'Own a whole colour district.', es: 'Ten un barrio de un color entero.' },
    },
    {
      id: 'hotel',
      title: { en: 'Hotelier', es: 'Hotelero' },
      description: { en: 'Build a hotel.', es: 'Construye un hotel.' },
    },
    {
      id: 'bankrupter',
      title: { en: 'Foreclosure', es: 'Desahucio' },
      description: {
        en: 'Drive a player into bankruptcy.',
        es: 'Lleva a un jugador a la quiebra.',
      },
    },
  ],
};
