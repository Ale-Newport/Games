import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'idle-bakery',
  number: 228,
  title: { en: 'Idle Bakery', es: 'Pastelería incremental' },
  tagline: {
    en: 'Click the big cookie, hire grandmas, open portals — and never stop baking.',
    es: 'Haz clic en la galleta gigante, contrata abuelas, abre portales… y no dejes de hornear.',
  },
  description: {
    en: 'The idle clicker that made baking an obsession: click a giant cookie, buy twelve kinds of buildings from cursors to time machines, unlock doubling upgrades, catch golden pastries for lucky hauls and frenzies, and ascend for permanent prestige. It keeps baking (a little) while you are away and saves itself.',
    es: 'El juego incremental que convirtió hornear en una obsesión: haz clic en una galleta gigante, compra doce tipos de edificios, de cursores a máquinas del tiempo, desbloquea mejoras que duplican, atrapa pasteles dorados para hornadas de suerte y frenesíes, y asciende para ganar prestigio permanente. Sigue horneando (un poco) mientras no estás y se guarda solo.',
  },
  category: 'viral',
  genre: { en: 'Idle', es: 'Incremental' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Cookies baked ever', es: 'Galletas horneadas en total' } },
  tags: ['idle', 'clicker', 'incremental', 'casual'],
  achievements: [
    {
      id: 'batch',
      title: { en: 'First Batch', es: 'Primera hornada' },
      description: { en: 'Bake 1,000 cookies.', es: 'Hornea 1000 galletas.' },
    },
    {
      id: 'million',
      title: { en: 'Millionaire Baker', es: 'Pastelero millonario' },
      description: { en: 'Bake a million cookies.', es: 'Hornea un millón de galletas.' },
    },
    {
      id: 'billion',
      title: { en: 'Cookie Mogul', es: 'Magnate galletero' },
      description: { en: 'Bake a billion cookies.', es: 'Hornea mil millones de galletas.' },
    },
    {
      id: 'clicker',
      title: { en: 'Tireless Finger', es: 'Dedo incansable' },
      description: {
        en: 'Click the cookie 1,000 times.',
        es: 'Haz clic 1000 veces en la galleta.',
      },
    },
    {
      id: 'golden',
      title: { en: 'Golden Touch', es: 'Toque dorado' },
      description: { en: 'Click a golden pastry.', es: 'Atrapa un pastel dorado.' },
    },
    {
      id: 'tycoon',
      title: { en: 'Tycoon', es: 'Magnate' },
      description: { en: 'Own 100 buildings.', es: 'Ten 100 edificios.' },
    },
    {
      id: 'ascend',
      title: { en: 'Ascended', es: 'Ascendido' },
      description: { en: 'Ascend for prestige.', es: 'Asciende para ganar prestigio.' },
    },
  ],
};
