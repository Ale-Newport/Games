import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'price-check',
  number: 237,
  title: { en: 'Price Check', es: '¿Cuánto costó?' },
  tagline: {
    en: 'A console at launch, a camera, a first edition, a Van Gogh at auction: what did it cost?',
    es: 'Una consola al salir, una cámara, una primera edición, un Van Gogh subastado: ¿cuánto costó?',
  },
  description: {
    en: 'The price-guessing game on real records: 1,149 verified, dated prices from Wikidata — consoles and games at launch, computers, cameras, phones, books, software, aircraft and auctioned art — with photos from Wikimedia Commons (credited) or original illustrations. Guess closest, or play the don’t-go-over rule; every reveal adds the price in today’s money from World Bank inflation. Daily six-item challenge and endless play by category.',
    es: 'El juego de adivinar precios con datos reales: 1.149 precios verificados y fechados de Wikidata —consolas y juegos al salir, ordenadores, cámaras, móviles, libros, programas, aviones y arte subastado— con fotos de Wikimedia Commons (acreditadas) o ilustraciones propias. Acércate lo más posible o juega sin pasarte; cada respuesta muestra el precio en dinero de hoy según la inflación del Banco Mundial. Reto diario de seis artículos y juego sin fin por categorías.',
  },
  category: 'estimation',
  genre: { en: 'Price guessing', es: 'Adivinar precios' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['prices', 'estimation', 'history', 'technology', 'art', 'daily'],
  achievements: [
    {
      id: 'first-price',
      title: { en: 'Window Shopper', es: 'Mirando escaparates' },
      description: { en: 'Lock in your first price.', es: 'Fija tu primer precio.' },
    },
    {
      id: 'spot-on',
      title: { en: 'Price Is Right', es: 'Precio justo' },
      description: { en: 'Guess a price within 2 %.', es: 'Acierta un precio a menos del 2 %.' },
    },
    {
      id: 'auctioneer',
      title: { en: 'Auctioneer', es: 'Subastador' },
      description: {
        en: 'Score 70 or more on a work of art.',
        es: 'Consigue 70 o más con una obra de arte.',
      },
    },
    {
      id: 'just-under',
      title: { en: 'Just Under', es: 'Por debajo, por poco' },
      description: {
        en: 'Score 90 or more under the don’t-go-over rule.',
        es: 'Consigue 90 o más con la regla de no pasarse.',
      },
    },
    {
      id: 'week',
      title: { en: 'Regular Shopper', es: 'Cliente habitual' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
