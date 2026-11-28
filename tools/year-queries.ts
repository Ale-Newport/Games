/**
 * Wikidata queries for Year Guess (#239): dated statements (year precision or better) of notable
 * items, per kind of event, with rank, labels and descriptions in English and Spanish.
 */
export interface YearQuery {
  /** Question kind. */
  id: string;
  prop: string;
  classes: string[] | null;
  minSitelinks: number;
  /** Extra graph pattern. */
  extra?: string;
}

export function yearQuery(y: YearQuery): string {
  // The join order is fixed (class → fame → dates → labels): the default plan times out on big
  // classes such as literary works.
  const first = y.classes
    ? `VALUES ?class { ${y.classes.map((c) => `wd:${c}`).join(' ')} }
  ?item wdt:P31 ?class .
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${y.minSitelinks})
  ?item p:${y.prop} ?st .`
    : `?item p:${y.prop} ?st .
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= ${y.minSitelinks})`;
  return `SELECT ?item ?sl ?time ?prec ?rank ?en ?es ?mul ?den ?des WHERE {
  hint:Query hint:optimizer "None" .
  ${first}
  ${y.extra ?? ''}
  ?st psv:${y.prop} [ wikibase:timeValue ?time ; wikibase:timePrecision ?prec ] ; wikibase:rank ?rank .
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
  OPTIONAL { ?item rdfs:label ?mul . FILTER(lang(?mul) = "mul") }
  OPTIONAL { ?item schema:description ?den . FILTER(lang(?den) = "en") }
  OPTIONAL { ?item schema:description ?des . FILTER(lang(?des) = "es") }
}`;
}

export const YEAR_QUERIES: YearQuery[] = [
  { id: 'battle', prop: 'P585', classes: ['Q178561', 'Q188055'], minSitelinks: 25 },
  { id: 'battle-start', prop: 'P580', classes: ['Q178561', 'Q188055'], minSitelinks: 25 },
  { id: 'war', prop: 'P580', classes: ['Q198', 'Q8465', 'Q103495'], minSitelinks: 30 },
  { id: 'treaty', prop: 'P585', classes: ['Q131569', 'Q625298'], minSitelinks: 20 },
  { id: 'treaty-signed', prop: 'P571', classes: ['Q131569', 'Q625298'], minSitelinks: 20 },
  // Discoveries and inventions with a named discoverer or inventor (astronomy is filtered later).
  { id: 'discovery', prop: 'P575', classes: null, minSitelinks: 60, extra: '?item wdt:P61 [] .' },
  { id: 'film', prop: 'P577', classes: ['Q11424'], minSitelinks: 45 },
  { id: 'book', prop: 'P577', classes: ['Q7725634', 'Q8261'], minSitelinks: 40 },
  { id: 'painting', prop: 'P571', classes: ['Q3305213'], minSitelinks: 20 },
  { id: 'opened', prop: 'P1619', classes: null, minSitelinks: 50 },
  {
    id: 'company',
    prop: 'P571',
    classes: ['Q4830453', 'Q891723', 'Q6881511', 'Q783794'],
    minSitelinks: 50,
  },
  {
    id: 'disaster',
    prop: 'P585',
    classes: ['Q7944', 'Q7692360', 'Q3839081', 'Q168983', 'Q8065'],
    minSitelinks: 15,
  },
  { id: 'album', prop: 'P577', classes: ['Q482994'], minSitelinks: 25 },
  { id: 'game', prop: 'P577', classes: ['Q7889'], minSitelinks: 35 },
  { id: 'spaceflight', prop: 'P619', classes: null, minSitelinks: 30 },
];
