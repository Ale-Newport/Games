/** Minimal Wikidata Query Service client for the data build tools (rate-limit aware). */
export async function sparql(query: string): Promise<unknown> {
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`;
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
