import { useState } from 'react';
import { ROADMAP, type DevStatus } from '../../data/roadmap';
import { useT } from '../platform';
import styles from './pages.module.css';

const STATUS_KEYS: Record<DevStatus, string> = {
  COMPLETE: 'roadmap.complete',
  IN_PROGRESS: 'roadmap.inProgress',
  TESTING: 'roadmap.testing',
  TODO: 'roadmap.todo',
  BLOCKED: 'roadmap.blocked',
};

export function RoadmapPage() {
  const t = useT();
  const [status, setStatus] = useState<DevStatus | null>(null);
  const counts = ROADMAP.reduce<Record<DevStatus, number>>(
    (acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1 }),
    { COMPLETE: 0, IN_PROGRESS: 0, TESTING: 0, TODO: 0, BLOCKED: 0 },
  );
  const rows = status ? ROADMAP.filter((r) => r.status === status) : ROADMAP;

  return (
    <div className="page">
      <h1 className="page-title">{t('roadmap.title')}</h1>
      <p className="page-subtitle">{t('roadmap.subtitle')}</p>
      <div className={styles.statsRow} style={{ marginBottom: 'var(--space-5)' }}>
        {(Object.keys(STATUS_KEYS) as DevStatus[]).map((s) => (
          <div key={s} className={styles.statTile}>
            <div className={styles.statValue} data-testid={`roadmap-count-${s}`}>
              {counts[s]}
            </div>
            <div className={styles.statLabel}>{t(STATUS_KEYS[s])}</div>
          </div>
        ))}
      </div>
      <div
        className={styles.progressBar}
        aria-label={`${counts.COMPLETE} / ${ROADMAP.length}`}
        role="img"
      >
        <div
          className={styles.progressFill}
          style={{ width: `${(counts.COMPLETE / ROADMAP.length) * 100}%` }}
        />
      </div>
      <div
        className={styles.chips}
        role="group"
        aria-label={t('roadmap.filter')}
        style={{ marginTop: 'var(--space-4)' }}
      >
        <button
          type="button"
          className="chip"
          aria-pressed={status === null}
          onClick={() => setStatus(null)}
        >
          {t('library.all')} ({ROADMAP.length})
        </button>
        {(Object.keys(STATUS_KEYS) as DevStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? null : s)}
          >
            {t(STATUS_KEYS[s])} ({counts[s]})
          </button>
        ))}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t('roadmap.col.number')}</th>
              <th scope="col">{t('roadmap.col.name')}</th>
              <th scope="col">{t('roadmap.col.category')}</th>
              <th scope="col">{t('roadmap.col.status')}</th>
              <th scope="col">{t('roadmap.col.parts')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {String(r.number).padStart(3, '0')}
                </td>
                <td>{r.name}</td>
                <td className="muted">{t(`category.${r.category}`)}</td>
                <td>
                  <span className={styles.badge} data-status={r.status}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <span
                    className={styles.parts}
                    aria-label={`engine ${r.engine}, graphics ${r.graphics}, content ${r.content}, tests ${r.tests}, ai ${r.ai}`}
                  >
                    {[r.engine, r.graphics, r.content, r.tests, r.ai].map((p, i) => (
                      <span key={i} className={styles.part} data-part={p} />
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
