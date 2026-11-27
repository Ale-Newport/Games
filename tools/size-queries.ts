/**
 * Wikidata queries for Size Sense (#232): one per object family, each returning every statement
 * of one dimension property with its unit, rank and any “applies to part” qualifier (antenna,
 * roof, hull section…); the generator drops qualified statements so only whole-object figures
 * remain. Labels come last: the query service is much faster that way.
 */

/** `radius` statements are doubled into diameters by the generator. */
export type Dimension = 'height' | 'length' | 'diameter' | 'wingspan' | 'radius';

const PROP: Record<Dimension, string> = {
  height: 'P2048',
  length: 'P2043',
  diameter: 'P2386',
  wingspan: 'P2050',
  radius: 'P2120',
};

export interface SizeQuery {
  id: string;
  dimension: Dimension;
  query: string;
}

function build(
  id: string,
  dimension: Dimension,
  classes: string[],
  minSitelinks: number,
  opts: { subclass?: boolean; extra?: string; orbits?: boolean } = {},
): SizeQuery {
  const p = PROP[dimension];
  const typePath = opts.orbits
    ? 'wdt:P397|wdt:P397/wdt:P397'
    : opts.subclass
      ? 'wdt:P31/wdt:P279*'
      : 'wdt:P31';
  return {
    id,
    dimension,
    query: `SELECT ?item ?en ?es ?amount ?unit ?rank ?part ?sl WHERE {
  ?item p:${p} ?st .
  ?st psv:${p} [ wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit ] ; wikibase:rank ?rank .
  ?item ${typePath} ?class .
  VALUES ?class { ${classes.map((c) => `wd:${c}`).join(' ')} }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${minSitelinks})
  ${opts.extra ?? ''}
  OPTIONAL { ?st pq:P518 ?part }
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
}`,
  };
}

export const SIZE_QUERIES: SizeQuery[] = [
  build('skyscrapers', 'height', ['Q11303'], 6),
  build('towers', 'height', ['Q12518', 'Q11166728', 'Q1440300', 'Q2319498'], 6),
  build('lighthouses', 'height', ['Q39715'], 8),
  build('statues', 'height', ['Q179700', 'Q1779653', 'Q4989906'], 8),
  build('pyramids', 'height', ['Q12516'], 6),
  build('dams', 'height', ['Q12323'], 8),
  build('ferris-wheels', 'height', ['Q202570'], 4),
  build('roller-coasters', 'height', ['Q204832'], 6),
  build('rockets', 'height', ['Q697175'], 8, { subclass: true }),
  build('trees', 'height', ['Q811534', 'Q11906844'], 3),
  build('bridges', 'length', ['Q12280', 'Q158438', 'Q158218', 'Q12570', 'Q1825472', 'Q537127'], 8),
  // One query per ship type: the generic ship class is too large for the query service.
  ...[
    ['Q17205', 'carriers'],
    ['Q182531', 'battleships'],
    ['Q697196', 'liners'],
    ['Q170483', 'sailing-ships'],
    ['Q39804', 'cruise-ships'],
    ['Q170013', 'corvettes'],
    ['Q161705', 'frigates'],
    ['Q174736', 'destroyers'],
    ['Q2811', 'submarines'],
    ['Q17210', 'container-ships'],
  ].map(([c, name]) => build(`ships-${name}`, 'length', [c!], 6)),
  build('aircraft', 'length', ['Q15056995'], 12),
  build('aircraft-wings', 'wingspan', ['Q15056995'], 12),
  build('cars', 'length', ['Q3231690'], 12),
  build('locomotives', 'length', ['Q19832486', 'Q93301'], 4),
  build('coins', 'diameter', ['Q41207', 'Q1047113', 'Q2280692'], 2),
  // Bodies orbiting the Sun, or orbiting something that orbits the Sun (planets, dwarf planets,
  // moons), by mean radius.
  build('solar-system', 'radius', ['Q525'], 12, { orbits: true }),
  build('stars', 'radius', ['Q523', 'Q5871', 'Q1142192'], 25),
];
