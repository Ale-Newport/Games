/**
 * The Land Baron board: 36 spaces round a harbour town of our own — eight colour districts (20
 * lots), four ferries, two works, two taxes, two Luck and two Council spaces, and four corners
 * (Start, the Lockup, the Plaza, Go to the Lockup). Prices and rents are this game's own: a lot's
 * base rent is a twelfth of its price, and houses multiply it by 5, 14, 38 and 52, a hotel by 66.
 */

export type SpaceKind =
  'start' | 'lot' | 'ferry' | 'works' | 'tax' | 'luck' | 'council' | 'lockup' | 'plaza' | 'arrest';

export interface Space {
  kind: SpaceKind;
  name: { en: string; es: string };
  /** Colour group for lots (0–7). */
  group?: number;
  price?: number;
  /** Rents for lots: base, 1–4 houses, hotel. */
  rent?: number[];
  houseCost?: number;
  tax?: number;
}

export const GROUPS = [
  { en: 'Saltmarsh', es: 'Salinas', colour: '#8d5a3b' },
  { en: 'Netmakers', es: 'Rederos', colour: '#7ec8e3' },
  { en: 'Old Quay', es: 'Muelle Viejo', colour: '#d16ba5' },
  { en: 'Lantern Row', es: 'Calle Farol', colour: '#f28c28' },
  { en: 'Market Hill', es: 'Cerro del Mercado', colour: '#e53935' },
  { en: 'Bell Gardens', es: 'Jardines de la Campana', colour: '#f2d22e' },
  { en: 'Admiralty', es: 'Almirantazgo', colour: '#2e9d5b' },
  { en: 'Crown Heights', es: 'Altos de la Corona', colour: '#3949ab' },
] as const;

const MULT = [1, 5, 14, 38, 52, 66];
const HOUSE = [50, 50, 100, 100, 150, 150, 200, 200];

const lot = (en: string, es: string, group: number, price: number): Space => ({
  kind: 'lot',
  name: { en, es },
  group,
  price,
  rent: MULT.map((m) => Math.round((price / 12) * m)),
  houseCost: HOUSE[group],
});
const ferry = (en: string, es: string): Space => ({ kind: 'ferry', name: { en, es }, price: 200 });
const works = (en: string, es: string): Space => ({ kind: 'works', name: { en, es }, price: 150 });
const S = (kind: SpaceKind, en: string, es: string, extra: Partial<Space> = {}): Space => ({
  kind,
  name: { en, es },
  ...extra,
});

export const SPACES: Space[] = [
  S('start', 'Start', 'Salida'),
  lot('Reed Lane', 'Calleja del Junco', 0, 60),
  S('council', 'Council', 'Concejo'),
  lot('Mudflat Row', 'Hilera del Fango', 0, 70),
  S('tax', 'Harbour Levy', 'Arbitrio del Puerto', { tax: 200 }),
  ferry('North Ferry', 'Ferri del Norte'),
  lot('Twine Street', 'Calle del Bramante', 1, 100),
  S('luck', 'Luck', 'Suerte'),
  lot('Float Yard', 'Patio de los Corchos', 1, 110),
  S('lockup', 'Lockup', 'Calabozo'),
  lot('Barrel Steps', 'Escalones del Barril', 2, 140),
  works('Tide Mill', 'Molino de Marea'),
  lot('Rope Walk', 'Paseo de las Cuerdas', 2, 140),
  lot('Customs Yard', 'Patio de Aduanas', 2, 160),
  ferry('East Ferry', 'Ferri del Este'),
  lot('Wick Street', 'Calle de la Mecha', 3, 180),
  lot('Oil Court', 'Plaza del Aceite', 3, 180),
  lot('Glass Alley', 'Callejón del Vidrio', 3, 200),
  S('plaza', 'Plaza', 'Plaza Mayor'),
  lot('Spice Market', 'Mercado de Especias', 4, 220),
  S('luck', 'Luck', 'Suerte'),
  lot('Fishmongers', 'Pescaderías', 4, 220),
  lot('Clock Square', 'Plaza del Reloj', 4, 240),
  ferry('South Ferry', 'Ferri del Sur'),
  lot('Rose Walk', 'Paseo de las Rosas', 5, 260),
  lot('Fountain Lane', 'Calle de la Fuente', 5, 260),
  lot('Belfry Close', 'Cerrada del Campanario', 5, 280),
  S('arrest', 'Go to the Lockup', 'Al calabozo'),
  lot('Chart House', 'Casa de las Cartas', 6, 300),
  works('Lighthouse Works', 'Taller del Faro'),
  lot('Anchor Terrace', 'Terraza del Ancla', 6, 320),
  S('council', 'Council', 'Concejo'),
  ferry('West Ferry', 'Ferri del Oeste'),
  lot('Regent Crescent', 'Media Luna del Regente', 7, 350),
  S('tax', 'Luxury Duty', 'Impuesto de Lujo', { tax: 100 }),
  lot('Crown Parade', 'Paseo de la Corona', 7, 400),
];

export const SIZE = SPACES.length;
export const START_PAY = 200;
export const LOCKUP = SPACES.findIndex((s) => s.kind === 'lockup');
export const ARREST = SPACES.findIndex((s) => s.kind === 'arrest');
export const BAIL = 50;
export const FERRY_RENT = [25, 50, 100, 200];
export const WORKS_MULT = [4, 10];
export const HOUSES = 32;
export const HOTELS = 12;
export const START_CASH = 1500;

/** Spaces that can be owned. */
export const OWNABLE = SPACES.map((s, i) => (s.price ? i : -1)).filter((i) => i >= 0);
export const GROUP_LOTS = GROUPS.map((_, g) =>
  SPACES.map((s, i) => (s.kind === 'lot' && s.group === g ? i : -1)).filter((i) => i >= 0),
);
export const FERRIES = SPACES.map((s, i) => (s.kind === 'ferry' ? i : -1)).filter((i) => i >= 0);
export const WORKS = SPACES.map((s, i) => (s.kind === 'works' ? i : -1)).filter((i) => i >= 0);

/** Luck and Council cards (our own texts and effects). */
export type CardEffect =
  | { k: 'move'; to: number }
  | { k: 'back'; n: number }
  | { k: 'nearest'; kind: 'ferry' | 'works' }
  | { k: 'money'; n: number }
  | { k: 'each'; n: number }
  | { k: 'repairs'; house: number; hotel: number }
  | { k: 'lockup' }
  | { k: 'pardon' };

export interface Card {
  id: string;
  text: { en: string; es: string };
  effect: CardEffect;
}

export const LUCK: Card[] = [
  {
    id: 'l-start',
    text: {
      en: 'A tailwind: sail straight to Start.',
      es: 'Viento a favor: navega hasta la Salida.',
    },
    effect: { k: 'move', to: 0 },
  },
  {
    id: 'l-crown',
    text: {
      en: 'Invited to a gala at Crown Parade.',
      es: 'Te invitan a una gala en el Paseo de la Corona.',
    },
    effect: { k: 'move', to: 35 },
  },
  {
    id: 'l-spice',
    text: { en: 'Go to the Spice Market.', es: 'Ve al Mercado de Especias.' },
    effect: { k: 'move', to: 19 },
  },
  {
    id: 'l-barrel',
    text: {
      en: 'Deliver a barrel to Barrel Steps.',
      es: 'Entrega un barril en los Escalones del Barril.',
    },
    effect: { k: 'move', to: 10 },
  },
  {
    id: 'l-ferry1',
    text: {
      en: 'Catch the nearest ferry; if owned, pay double fare.',
      es: 'Toma el ferri más cercano; si tiene dueño, paga el doble.',
    },
    effect: { k: 'nearest', kind: 'ferry' },
  },
  {
    id: 'l-ferry2',
    text: {
      en: 'Run for the nearest ferry; if owned, pay double fare.',
      es: 'Corre al ferri más cercano; si tiene dueño, paga el doble.',
    },
    effect: { k: 'nearest', kind: 'ferry' },
  },
  {
    id: 'l-works',
    text: {
      en: 'Inspect the nearest works; if owned, pay ten times the dice.',
      es: 'Inspecciona el taller más cercano; si tiene dueño, paga diez veces los dados.',
    },
    effect: { k: 'nearest', kind: 'works' },
  },
  {
    id: 'l-back',
    text: { en: 'Fog: drift back three spaces.', es: 'Niebla: retrocede tres casillas.' },
    effect: { k: 'back', n: 3 },
  },
  {
    id: 'l-lockup',
    text: {
      en: 'Caught smuggling: go to the Lockup.',
      es: 'Te pillan contrabandeando: al calabozo.',
    },
    effect: { k: 'lockup' },
  },
  {
    id: 'l-pardon',
    text: {
      en: 'Harbour pardon: keep this to leave the Lockup free.',
      es: 'Indulto del puerto: guárdala para salir gratis del calabozo.',
    },
    effect: { k: 'pardon' },
  },
  {
    id: 'l-dividend',
    text: { en: 'Your cargo sells well: collect 60.', es: 'Tu carga se vende bien: cobra 60.' },
    effect: { k: 'money', n: 60 },
  },
  {
    id: 'l-loan',
    text: { en: 'A loan matures: collect 150.', es: 'Vence un préstamo: cobra 150.' },
    effect: { k: 'money', n: 150 },
  },
  {
    id: 'l-fine',
    text: { en: 'Mooring fine: pay 20.', es: 'Multa de amarre: paga 20.' },
    effect: { k: 'money', n: -20 },
  },
  {
    id: 'l-chair',
    text: {
      en: 'Chosen harbour master: pay each player 50.',
      es: 'Te eligen capitán de puerto: paga 50 a cada jugador.',
    },
    effect: { k: 'each', n: -50 },
  },
  {
    id: 'l-repairs',
    text: {
      en: 'Storm damage: pay 25 per house and 100 per hotel.',
      es: 'Daños del temporal: paga 25 por casa y 100 por hotel.',
    },
    effect: { k: 'repairs', house: 25, hotel: 100 },
  },
  {
    id: 'l-toll',
    text: { en: 'Bridge toll: pay 15.', es: 'Peaje del puente: paga 15.' },
    effect: { k: 'money', n: -15 },
  },
];

export const COUNCIL: Card[] = [
  {
    id: 'c-start',
    text: {
      en: 'The council clears your path: go to Start.',
      es: 'El concejo te abre paso: ve a la Salida.',
    },
    effect: { k: 'move', to: 0 },
  },
  {
    id: 'c-refund',
    text: { en: 'Tax refund: collect 20.', es: 'Devolución de impuestos: cobra 20.' },
    effect: { k: 'money', n: 20 },
  },
  {
    id: 'c-error',
    text: {
      en: 'A clerk’s error in your favour: collect 200.',
      es: 'Error del escribano a tu favor: cobra 200.',
    },
    effect: { k: 'money', n: 200 },
  },
  {
    id: 'c-fee',
    text: { en: 'Physician’s fee: pay 50.', es: 'Honorarios del médico: paga 50.' },
    effect: { k: 'money', n: -50 },
  },
  {
    id: 'c-stock',
    text: { en: 'Sale of fishing stock: collect 50.', es: 'Venta de aparejos: cobra 50.' },
    effect: { k: 'money', n: 50 },
  },
  {
    id: 'c-pardon',
    text: {
      en: 'Council pardon: keep this to leave the Lockup free.',
      es: 'Indulto del concejo: guárdala para salir gratis del calabozo.',
    },
    effect: { k: 'pardon' },
  },
  {
    id: 'c-lockup',
    text: { en: 'Unpaid dues: go to the Lockup.', es: 'Cuotas impagadas: al calabozo.' },
    effect: { k: 'lockup' },
  },
  {
    id: 'c-festival',
    text: {
      en: 'Festival night: collect 10 from each player.',
      es: 'Noche de fiesta: cobra 10 a cada jugador.',
    },
    effect: { k: 'each', n: 10 },
  },
  {
    id: 'c-fund',
    text: { en: 'Harbour fund pays out: collect 100.', es: 'El fondo del puerto paga: cobra 100.' },
    effect: { k: 'money', n: 100 },
  },
  {
    id: 'c-school',
    text: { en: 'School levy: pay 100.', es: 'Tasa escolar: paga 100.' },
    effect: { k: 'money', n: -100 },
  },
  {
    id: 'c-insurance',
    text: { en: 'Insurance matures: collect 100.', es: 'Vence el seguro: cobra 100.' },
    effect: { k: 'money', n: 100 },
  },
  {
    id: 'c-street',
    text: {
      en: 'Street repairs: pay 40 per house and 115 per hotel.',
      es: 'Arreglo de calles: paga 40 por casa y 115 por hotel.',
    },
    effect: { k: 'repairs', house: 40, hotel: 115 },
  },
  {
    id: 'c-prize',
    text: {
      en: 'Second prize at the regatta: collect 10.',
      es: 'Segundo premio en la regata: cobra 10.',
    },
    effect: { k: 'money', n: 10 },
  },
  {
    id: 'c-legacy',
    text: { en: 'You inherit 100.', es: 'Heredas 100.' },
    effect: { k: 'money', n: 100 },
  },
  {
    id: 'c-hospital',
    text: { en: 'Hospital donation: pay 50.', es: 'Donativo al hospital: paga 50.' },
    effect: { k: 'money', n: -50 },
  },
  {
    id: 'c-consult',
    text: { en: 'Consulting fee: collect 25.', es: 'Asesoría: cobra 25.' },
    effect: { k: 'money', n: 25 },
  },
];
