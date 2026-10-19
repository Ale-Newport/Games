/** Minimal async key-value storage used for structured platform data and game saves. */
export interface KeyValueStore {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
}

export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    const value = this.data.get(key);
    return value === undefined ? undefined : (structuredClone(value) as T);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, structuredClone(value));
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async keys(prefix = ''): Promise<string[]> {
    return [...this.data.keys()].filter((key) => key.startsWith(prefix));
  }
}

const STORE_NAME = 'kv';

/** IndexedDB-backed store. Falls back to memory when IndexedDB is unavailable or blocked. */
export class IndexedDbStore implements KeyValueStore {
  private readonly db: Promise<IDBDatabase>;

  constructor(name = 'arcade-ai-lab', factory: IDBFactory = indexedDB) {
    this.db = new Promise((resolve, reject) => {
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
      request.onblocked = () => reject(new Error('IndexedDB open blocked'));
    });
  }

  private async run<T>(
    mode: IDBTransactionMode,
    body: (store: IDBObjectStore) => IDBRequest,
  ): Promise<T> {
    const db = await this.db;
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = body(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => resolve(request.result as T);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    });
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.run<T | undefined>('readonly', (store) => store.get(key));
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.run('readwrite', (store) => store.put(value, key));
  }

  async delete(key: string): Promise<void> {
    await this.run('readwrite', (store) => store.delete(key));
  }

  async keys(prefix = ''): Promise<string[]> {
    const all = await this.run<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
    return all.map(String).filter((key) => key.startsWith(prefix));
  }
}

/** Opens IndexedDB when possible; otherwise returns an in-memory store (e.g. private browsing). */
export async function openDefaultStore(): Promise<KeyValueStore> {
  if (typeof indexedDB === 'undefined') return new MemoryStore();
  try {
    const store = new IndexedDbStore();
    await store.keys('__probe__');
    return store;
  } catch (error) {
    console.warn('IndexedDB unavailable; progress will not persist this session.', error);
    return new MemoryStore();
  }
}
