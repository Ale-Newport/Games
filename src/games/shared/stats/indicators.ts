/**
 * The World Development Indicators shipped with the statistics games (World Bank Open Data,
 * CC BY 4.0). Titles are our own short wording of the official indicator names; the codes link
 * each one to its official definition at https://data.worldbank.org/indicator/<code>.
 * Dependency-free: tools/generate-stats.ts imports it from Node.
 */

export type StatTopic = 'economy' | 'people' | 'health' | 'environment' | 'technology' | 'society';

export const TOPICS: StatTopic[] = [
  'economy',
  'people',
  'health',
  'environment',
  'technology',
  'society',
];

/** How a value is shown: `pct` → "12.3 %", `money` → "$1.2 bn", `count` → "3.4 M", `plain`. */
export type StatFormat = 'pct' | 'money' | 'count' | 'plain';

export interface Indicator {
  code: string;
  topic: StatTopic;
  title: { en: string; es: string };
  /** Unit label shown under the axis (empty when the format already says it). */
  unit: { en: string; es: string };
  format: StatFormat;
  /** Significant digits kept in the shipped data. */
  digits: number;
  /** Year-to-year noise: 1 smooth (demographics), 2 moderate, 3 volatile (growth rates). */
  volatility: 1 | 2 | 3;
  /** Values can be negative (growth rates, balances). */
  signed?: boolean;
  /** Hard upper bound of the measure (shares of a total cannot pass 100 %). */
  max?: number;
}

const t = (en: string, es: string) => ({ en, es });
const none = t('', '');

export const INDICATORS: Indicator[] = [
  // Economy
  {
    code: 'NY.GDP.MKTP.CD',
    topic: 'economy',
    title: t('GDP (current US$)', 'PIB (US$ corrientes)'),
    unit: t('US dollars', 'dólares estadounidenses'),
    format: 'money',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'NY.GDP.PCAP.CD',
    topic: 'economy',
    title: t('GDP per person (current US$)', 'PIB por habitante (US$ corrientes)'),
    unit: t('US dollars per person', 'dólares por habitante'),
    format: 'money',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'NY.GDP.PCAP.KD',
    topic: 'economy',
    title: t('GDP per person (constant 2015 US$)', 'PIB por habitante (US$ constantes de 2015)'),
    unit: t('2015 US dollars per person', 'dólares de 2015 por habitante'),
    format: 'money',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'NY.GDP.MKTP.KD.ZG',
    topic: 'economy',
    title: t('GDP growth (annual %)', 'Crecimiento del PIB (% anual)'),
    unit: none,
    format: 'pct',
    digits: 2,
    volatility: 3,
    signed: true,
  },
  {
    code: 'FP.CPI.TOTL.ZG',
    topic: 'economy',
    title: t('Inflation, consumer prices (annual %)', 'Inflación, precios al consumidor (% anual)'),
    unit: none,
    format: 'pct',
    digits: 2,
    volatility: 3,
    signed: true,
  },
  {
    code: 'NE.EXP.GNFS.ZS',
    topic: 'economy',
    title: t(
      'Exports of goods and services (% of GDP)',
      'Exportaciones de bienes y servicios (% del PIB)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'NE.IMP.GNFS.ZS',
    topic: 'economy',
    title: t(
      'Imports of goods and services (% of GDP)',
      'Importaciones de bienes y servicios (% del PIB)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'NV.AGR.TOTL.ZS',
    topic: 'economy',
    title: t(
      'Agriculture, forestry and fishing (% of GDP)',
      'Agricultura, silvicultura y pesca (% del PIB)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
    max: 100,
  },
  {
    code: 'NV.IND.MANF.ZS',
    topic: 'economy',
    title: t('Manufacturing (% of GDP)', 'Manufactura (% del PIB)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
    max: 100,
  },
  {
    code: 'SL.UEM.TOTL.ZS',
    topic: 'economy',
    title: t(
      'Unemployment (% of labour force, ILO estimate)',
      'Desempleo (% de la población activa, estimación OIT)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
    max: 100,
  },
  {
    code: 'GC.DOD.TOTL.GD.ZS',
    topic: 'economy',
    title: t('Central government debt (% of GDP)', 'Deuda del gobierno central (% del PIB)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'BX.TRF.PWKR.DT.GD.ZS',
    topic: 'economy',
    title: t(
      'Personal remittances received (% of GDP)',
      'Remesas personales recibidas (% del PIB)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
  },
  // People
  {
    code: 'SP.POP.TOTL',
    topic: 'people',
    title: t('Population', 'Población'),
    unit: t('people', 'personas'),
    format: 'count',
    digits: 4,
    volatility: 1,
  },
  {
    code: 'SP.URB.TOTL.IN.ZS',
    topic: 'people',
    title: t('Urban population (% of total)', 'Población urbana (% del total)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'SP.DYN.TFRT.IN',
    topic: 'people',
    title: t('Fertility rate (births per woman)', 'Tasa de fecundidad (hijos por mujer)'),
    unit: t('births per woman', 'hijos por mujer'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SP.POP.65UP.TO.ZS',
    topic: 'people',
    title: t(
      'Population aged 65 and over (% of total)',
      'Población de 65 años o más (% del total)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'SP.POP.0014.TO.ZS',
    topic: 'people',
    title: t('Population aged 0–14 (% of total)', 'Población de 0 a 14 años (% del total)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'SP.DYN.CBRT.IN',
    topic: 'people',
    title: t('Birth rate (per 1,000 people)', 'Tasa de natalidad (por 1.000 personas)'),
    unit: t('births per 1,000 people', 'nacimientos por 1.000 personas'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SP.DYN.CDRT.IN',
    topic: 'people',
    title: t('Death rate (per 1,000 people)', 'Tasa de mortalidad (por 1.000 personas)'),
    unit: t('deaths per 1,000 people', 'defunciones por 1.000 personas'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'EN.POP.DNST',
    topic: 'people',
    title: t('Population density (people per km²)', 'Densidad de población (personas por km²)'),
    unit: t('people per km² of land', 'personas por km² de tierra'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  // Health
  {
    code: 'SP.DYN.LE00.IN',
    topic: 'health',
    title: t('Life expectancy at birth (years)', 'Esperanza de vida al nacer (años)'),
    unit: t('years', 'años'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SP.DYN.IMRT.IN',
    topic: 'health',
    title: t(
      'Infant mortality (per 1,000 live births)',
      'Mortalidad infantil (por 1.000 nacidos vivos)',
    ),
    unit: t('deaths per 1,000 live births', 'muertes por 1.000 nacidos vivos'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SH.DYN.MORT',
    topic: 'health',
    title: t(
      'Under-5 mortality (per 1,000 live births)',
      'Mortalidad de menores de 5 años (por 1.000 nacidos vivos)',
    ),
    unit: t('deaths per 1,000 live births', 'muertes por 1.000 nacidos vivos'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SP.ADO.TFRT',
    topic: 'health',
    title: t(
      'Adolescent fertility (births per 1,000 women aged 15–19)',
      'Fecundidad adolescente (nacimientos por 1.000 mujeres de 15 a 19 años)',
    ),
    unit: t('births per 1,000 women aged 15–19', 'nacimientos por 1.000 mujeres de 15 a 19'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SH.XPD.CHEX.GD.ZS',
    topic: 'health',
    title: t('Health spending (% of GDP)', 'Gasto en salud (% del PIB)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'SH.STA.MMRT',
    topic: 'health',
    title: t(
      'Maternal mortality (per 100,000 live births)',
      'Mortalidad materna (por 100.000 nacidos vivos)',
    ),
    unit: t('deaths per 100,000 live births', 'muertes por 100.000 nacidos vivos'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  // Environment
  {
    code: 'AG.LND.FRST.ZS',
    topic: 'environment',
    title: t('Forest area (% of land area)', 'Superficie forestal (% de la superficie terrestre)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'AG.LND.ARBL.ZS',
    topic: 'environment',
    title: t('Arable land (% of land area)', 'Tierra cultivable (% de la superficie terrestre)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'AG.YLD.CREL.KG',
    topic: 'environment',
    title: t('Cereal yield (kg per hectare)', 'Rendimiento de cereales (kg por hectárea)'),
    unit: t('kg per hectare', 'kg por hectárea'),
    format: 'plain',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'EG.FEC.RNEW.ZS',
    topic: 'environment',
    title: t('Renewable energy (% of final energy use)', 'Energía renovable (% del consumo final)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'EG.USE.PCAP.KG.OE',
    topic: 'environment',
    title: t(
      'Energy use (kg of oil equivalent per person)',
      'Consumo de energía (kg de equivalente de petróleo por habitante)',
    ),
    unit: t('kg of oil equivalent per person', 'kg de equivalente de petróleo por habitante'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'EN.GHG.CO2.PC.CE.AR5',
    topic: 'environment',
    title: t('CO₂ emissions per person (tonnes)', 'Emisiones de CO₂ por habitante (toneladas)'),
    unit: t('tonnes of CO₂ per person', 'toneladas de CO₂ por habitante'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'EG.ELC.ACCS.ZS',
    topic: 'environment',
    title: t(
      'Access to electricity (% of population)',
      'Acceso a la electricidad (% de la población)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'AG.PRD.FOOD.XD',
    topic: 'environment',
    title: t(
      'Food production index (2014–2016 = 100)',
      'Índice de producción de alimentos (2014–2016 = 100)',
    ),
    unit: t('index, 2014–2016 = 100', 'índice, 2014–2016 = 100'),
    format: 'plain',
    digits: 3,
    volatility: 2,
  },
  // Technology
  {
    code: 'IT.CEL.SETS.P2',
    topic: 'technology',
    title: t(
      'Mobile phone subscriptions (per 100 people)',
      'Líneas de telefonía móvil (por 100 personas)',
    ),
    unit: t('subscriptions per 100 people', 'líneas por 100 personas'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'IT.NET.USER.ZS',
    topic: 'technology',
    title: t('Internet users (% of population)', 'Usuarios de internet (% de la población)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'IT.MLT.MAIN.P2',
    topic: 'technology',
    title: t(
      'Fixed telephone lines (per 100 people)',
      'Líneas de telefonía fija (por 100 personas)',
    ),
    unit: t('lines per 100 people', 'líneas por 100 personas'),
    format: 'plain',
    digits: 3,
    volatility: 1,
  },
  // Society
  {
    code: 'SE.PRM.ENRR',
    topic: 'society',
    title: t('Primary school enrolment (% gross)', 'Matriculación en primaria (% bruto)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SE.TER.ENRR',
    topic: 'society',
    title: t('University enrolment (% gross)', 'Matriculación universitaria (% bruto)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
  },
  {
    code: 'SL.TLF.CACT.FE.ZS',
    topic: 'society',
    title: t(
      'Women in the labour force (% of women 15+)',
      'Mujeres en la población activa (% de mujeres de 15+)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 1,
    max: 100,
  },
  {
    code: 'MS.MIL.XPND.GD.ZS',
    topic: 'society',
    title: t('Military spending (% of GDP)', 'Gasto militar (% del PIB)'),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'ST.INT.ARVL',
    topic: 'society',
    title: t('International tourist arrivals', 'Llegadas de turistas internacionales'),
    unit: t('arrivals', 'llegadas'),
    format: 'count',
    digits: 3,
    volatility: 2,
  },
  {
    code: 'SG.GEN.PARL.ZS',
    topic: 'society',
    title: t(
      'Seats held by women in parliament (%)',
      'Escaños ocupados por mujeres en el parlamento (%)',
    ),
    unit: none,
    format: 'pct',
    digits: 3,
    volatility: 2,
    max: 100,
  },
  {
    code: 'IS.AIR.PSGR',
    topic: 'society',
    title: t('Air passengers carried', 'Pasajeros aéreos transportados'),
    unit: t('passengers', 'pasajeros'),
    format: 'count',
    digits: 3,
    volatility: 2,
  },
];

export const INDICATOR_BY_CODE = new Map(INDICATORS.map((i) => [i.code, i]));
