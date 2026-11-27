/**
 * Wikidata queries for Order of Magnitude (#233): every statement of one quantity property for a
 * class of notable items, with unit, rank, “point in time” (P585) and “applies to part”.
 */
export interface MagnitudeQuery {
  id: string;
  query: string;
}

function q(id: string, prop: string, classes: string[], minSitelinks: number): MagnitudeQuery {
  return {
    id,
    query: `SELECT ?item ?en ?es ?amount ?unit ?rank ?time ?part ?sl WHERE {
  ?item p:${prop} ?st .
  ?st psv:${prop} [ wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit ] ; wikibase:rank ?rank .
  ?item wdt:P31 ?class .
  VALUES ?class { ${classes.map((c) => `wd:${c}`).join(' ')} }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${minSitelinks})
  OPTIONAL { ?st pq:P585 ?time }
  OPTIONAL { ?st pq:P518 ?part }
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
}`,
  };
}

export const MAGNITUDE_QUERIES: MagnitudeQuery[] = [
  q('cities', 'P1082', ['Q515', 'Q1549591', 'Q1637706', 'Q200250', 'Q5119'], 70),
  q('rivers', 'P2043', ['Q4022'], 35),
  q('mountains', 'P2044', ['Q8502', 'Q8072'], 30),
  q('lakes', 'P2046', ['Q23397', 'Q188025'], 30),
  q('islands', 'P2046', ['Q23442'], 40),
  q('countries', 'P2046', ['Q6256', 'Q3624078'], 100),
];
