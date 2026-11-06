/**
 * Versioned save envelopes with forward migrations.
 *
 * Every persisted record is wrapped as { schema, savedAt, data }. Readers declare the current
 * schema number, a migration for each older schema, and a validator. Anything that fails to parse,
 * migrate or validate is treated as absent (and reported), never thrown into the UI.
 */
export interface Envelope<T> {
  schema: number;
  savedAt: number;
  data: T;
}

export type Migration = (data: unknown) => unknown;

export interface VersionedSpec<T> {
  schema: number;
  /** migrations[n] upgrades a schema-n payload to schema n+1. */
  migrations?: Record<number, Migration>;
  validate: (data: unknown) => data is T;
}

export function wrap<T>(
  spec: Pick<VersionedSpec<T>, 'schema'>,
  data: T,
  now = Date.now(),
): Envelope<T> {
  return { schema: spec.schema, savedAt: now, data };
}

export type DecodeResult<T> =
  | { ok: true; data: T; migrated: boolean; savedAt: number }
  | {
      ok: false;
      reason: 'missing' | 'malformed' | 'future-schema' | 'migration-failed' | 'invalid';
    };

export function unwrap<T>(spec: VersionedSpec<T>, raw: unknown): DecodeResult<T> {
  if (raw === undefined || raw === null) return { ok: false, reason: 'missing' };
  if (typeof raw !== 'object' || !('schema' in raw) || !('data' in raw))
    return { ok: false, reason: 'malformed' };
  const envelope = raw as Partial<Envelope<unknown>>;
  if (typeof envelope.schema !== 'number' || !Number.isInteger(envelope.schema))
    return { ok: false, reason: 'malformed' };
  if (envelope.schema > spec.schema) return { ok: false, reason: 'future-schema' };
  let data = envelope.data;
  let version = envelope.schema;
  try {
    while (version < spec.schema) {
      const migrate = spec.migrations?.[version];
      if (!migrate) return { ok: false, reason: 'migration-failed' };
      data = migrate(data);
      version++;
    }
  } catch {
    return { ok: false, reason: 'migration-failed' };
  }
  if (!spec.validate(data)) return { ok: false, reason: 'invalid' };
  return {
    ok: true,
    data,
    migrated: envelope.schema !== spec.schema,
    savedAt: Number(envelope.savedAt) || 0,
  };
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
