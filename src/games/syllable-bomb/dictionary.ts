/**
 * The Syllable Bomb dictionary (English): Webster's Second International (1934, public domain)
 * plus the shared modern vocabulary, built by tools/generate-syllables.ts, loaded on demand.
 */
interface NodeFs {
  readFile(path: string | URL, encoding: 'utf8'): Promise<string>;
}
const host = globalThis as unknown as { process?: { versions?: { node?: string }; cwd(): string } };

let loading: Promise<string[]> | null = null;

export function loadWords(): Promise<string[]> {
  loading ??= (async () => {
    const proc = host.process;
    let text: string;
    if (proc?.versions?.node) {
      const fsName = 'node:fs/promises';
      const fs = (await import(/* @vite-ignore */ fsName)) as NodeFs;
      const u = new URL('./words.txt', import.meta.url);
      text = await fs.readFile(
        u.protocol === 'file:' ? u : `${proc.cwd()}${decodeURIComponent(u.pathname)}`,
        'utf8',
      );
    } else {
      const url = (await import('./words.txt?url')).default;
      text = await fetch(url).then((r) => r.text());
    }
    return text.split('\n').filter(Boolean);
  })();
  return loading;
}

/** Words containing a prompt, not yet used (bots and hints). */
export function wordsWith(
  words: readonly string[],
  prompt: string,
  used: readonly string[],
): string[] {
  const u = new Set(used);
  return words.filter((w) => w.includes(prompt) && !u.has(w));
}
