import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'endless-craft',
  number: 223,
  title: { en: 'Endless Craft', es: 'Creación sin fin' },
  tagline: {
    en: 'Start with water, fire, wind and earth — combine your way to dragons and robots.',
    es: 'Empieza con agua, fuego, viento y tierra y combina hasta llegar a dragones y robots.',
  },
  description: {
    en: 'A drag-and-drop crafting sandbox: drop one element on another to make something new, from steam and mud to life, cities, rockets, wizards and memes. 225 elements and 377 recipes in an original recipe book, with search, hints, keyboard play and auto-saved progress.',
    es: 'Un sandbox de creación con arrastrar y soltar: suelta un elemento sobre otro para crear algo nuevo, del vapor y el barro a la vida, las ciudades, los cohetes, los magos y los memes. 225 elementos y 377 recetas en un libro de recetas original, con búsqueda, pistas, juego con teclado y progreso guardado automáticamente.',
  },
  category: 'viral',
  genre: { en: 'Sandbox', es: 'Sandbox' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Discoveries', es: 'Descubrimientos' } },
  tags: ['sandbox', 'crafting', 'discovery', 'relaxing'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Eureka', es: 'Eureka' },
      description: { en: 'Make your first discovery.', es: 'Haz tu primer descubrimiento.' },
    },
    {
      id: 'found-25',
      title: { en: 'Apprentice Crafter', es: 'Aprendiz' },
      description: { en: 'Discover 25 elements.', es: 'Descubre 25 elementos.' },
    },
    {
      id: 'found-50',
      title: { en: 'Inventor', es: 'Inventor' },
      description: { en: 'Discover 50 elements.', es: 'Descubre 50 elementos.' },
    },
    {
      id: 'found-100',
      title: { en: 'Alchemist', es: 'Alquimista' },
      description: { en: 'Discover 100 elements.', es: 'Descubre 100 elementos.' },
    },
    {
      id: 'found-150',
      title: { en: 'World Builder', es: 'Constructor de mundos' },
      description: { en: 'Discover 150 elements.', es: 'Descubre 150 elementos.' },
    },
    {
      id: 'dragon',
      title: { en: 'Here Be Dragons', es: 'Aquí hay dragones' },
      description: { en: 'Discover the Dragon.', es: 'Descubre el Dragón.' },
    },
    {
      id: 'ai',
      title: { en: 'Singularity', es: 'Singularidad' },
      description: {
        en: 'Discover Artificial Intelligence.',
        es: 'Descubre la Inteligencia artificial.',
      },
    },
    {
      id: 'all',
      title: { en: 'Everything', es: 'Todo' },
      description: { en: 'Discover every element.', es: 'Descubre todos los elementos.' },
    },
  ],
};
