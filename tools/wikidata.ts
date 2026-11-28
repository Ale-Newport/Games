/** Minimal Wikidata Query Service client for the data build tools (rate-limit aware). */
export const WDQS = 'https://query.wikidata.org/sparql';
/**
 * QLever's public Wikidata endpoint (University of Freiburg): the same CC0 data from a recent
 * dump, much faster on large classes and unaffected by WDQS outages. It needs explicit prefixes
 * and ignores Blazegraph hints, which are stripped.
 */
export const QLEVER = 'https://qlever.dev/api/wikidata';
const PREFIXES = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
`;

export async function sparql(query: string, endpoint = WDQS): Promise<unknown> {
  const q = endpoint === QLEVER ? PREFIXES + query.replace(/^\s*hint:[^\n]*\n/gm, '') : query;
  const url = `${endpoint}?query=${encodeURIComponent(q)}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': 'arcade-games-data-builder/1.0 (offline dataset build)',
        },
      });
      if (res.status === 429) {
        // Respect the service's rate limit.
        const wait = Number(res.headers.get('retry-after') ?? 60);
        await new Promise((r) => setTimeout(r, (wait + 2) * 1000));
        if (attempt < 6) continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      // Some labels carry raw control characters, which JSON.parse rejects inside strings.
      const text = await res.text();
      // eslint-disable-next-line no-control-regex -- stripping control characters is the point
      return JSON.parse(text.replace(/[\u0000-\u001f]/g, ' '));
    } catch (e) {
      if (attempt >= 6) throw e;
      await new Promise((r) => setTimeout(r, 8000 * attempt));
    }
  }
}
