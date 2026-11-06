/** Safe LocalStorage access for lightweight preferences. Never throws. */
export function readLocal(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

export function writeLocal(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
