import { Lock, Plus, Trophy } from 'lucide-react';
import { useState } from 'react';
import { pickText } from '../../core/i18n';
import { MANIFESTS } from '../../games/registry';
import { useLocale, usePlatform, useProfile, useT } from '../platform';
import styles from './pages.module.css';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function ProfilePage() {
  const t = useT();
  const locale = useLocale();
  const profile = useProfile();
  const { profiles } = usePlatform();
  const [name, setName] = useState(profile.name);
  const [newName, setNewName] = useState('');
  const index = profiles.getIndex();
  const played = MANIFESTS.filter((m) => profile.stats[m.id]);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <div className="page">
      <h1 className="page-title">{t('profile.title')}</h1>
      <div className={styles.formGrid} style={{ marginBottom: 'var(--space-7)' }}>
        <form
          className={styles.fieldset}
          onSubmit={(e) => {
            e.preventDefault();
            void profiles.renameProfile(name);
          }}
        >
          <div className="field">
            <label htmlFor="profile-name">{t('profile.name')}</label>
            <div className={styles.row} style={{ justifyContent: 'flex-start' }}>
              <input
                id="profile-name"
                className="input"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                {t('profile.save')}
              </button>
            </div>
          </div>
          {index.profiles.length > 1 && (
            <div className="field">
              <label htmlFor="profile-switch">{t('profile.switch')}</label>
              <select
                id="profile-switch"
                className="select"
                value={profile.id}
                onChange={(e) => {
                  void profiles
                    .switchProfile(e.target.value)
                    .then(() => setName(profiles.getProfile().name));
                }}
              >
                {index.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="profile-new">{t('profile.createPrompt')}</label>
            <div className={styles.row} style={{ justifyContent: 'flex-start' }}>
              <input
                id="profile-new"
                className="input"
                value={newName}
                maxLength={24}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                type="button"
                className="btn"
                disabled={!newName.trim()}
                onClick={() => {
                  void profiles.createProfile(newName).then(() => {
                    setName(profiles.getProfile().name);
                    setNewName('');
                  });
                }}
              >
                <Plus size={16} /> {t('profile.create')}
              </button>
            </div>
          </div>
        </form>
      </div>

      <section className={styles.section} aria-labelledby="stats-title">
        <h2
          id="stats-title"
          className={styles.sectionTitle}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {t('profile.stats')}
        </h2>
        {played.length === 0 && <div className={styles.empty}>{t('profile.noStats')}</div>}
        {played.map((m) => {
          const s = profile.stats[m.id]!;
          return (
            <div key={m.id} className={styles.gameStatBlock}>
              <div className={styles.gameStatHeader}>
                <h3>{pickText(m.title, locale)}</h3>
              </div>
              <dl className={styles.kv}>
                <div>
                  <dt>{t('stats.played')}</dt>
                  <dd>{s.played}</dd>
                </div>
                <div>
                  <dt>{t('stats.wins')}</dt>
                  <dd>{s.wins}</dd>
                </div>
                <div>
                  <dt>{t('stats.losses')}</dt>
                  <dd>{s.losses}</dd>
                </div>
                <div>
                  <dt>{t('stats.draws')}</dt>
                  <dd>{s.draws}</dd>
                </div>
                {s.completions > 0 && (
                  <div>
                    <dt>{t('stats.completions')}</dt>
                    <dd>{s.completions}</dd>
                  </div>
                )}
                {s.bestScore !== undefined && (
                  <div>
                    <dt>{t('stats.best')}</dt>
                    <dd>{s.bestScore}</dd>
                  </div>
                )}
                {s.bestTimeMs !== undefined && (
                  <div>
                    <dt>{t('stats.bestTime')}</dt>
                    <dd>{formatDuration(s.bestTimeMs)}</dd>
                  </div>
                )}
                <div>
                  <dt>{t('stats.streak')}</dt>
                  <dd>{s.bestStreak}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </section>

      <section className={styles.section} aria-labelledby="ach-title">
        <h2
          id="ach-title"
          className={styles.sectionTitle}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {t('profile.achievements')}
        </h2>
        {MANIFESTS.filter((m) => m.achievements.length > 0).map((m) => (
          <div key={m.id} style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>{pickText(m.title, locale)}</h3>
            <ul className={styles.achievementList}>
              {m.achievements.map((a) => {
                const unlockedAt = profile.achievements[m.id]?.[a.id];
                const hidden = a.secret && !unlockedAt;
                return (
                  <li key={a.id} className={styles.achievement} data-locked={!unlockedAt}>
                    <span className={styles.achievementIcon} aria-hidden="true">
                      {unlockedAt ? <Trophy size={18} /> : <Lock size={16} />}
                    </span>
                    <span>
                      <span className={styles.achievementTitle}>
                        {hidden ? t('profile.secret') : pickText(a.title, locale)}
                      </span>
                      <br />
                      <span className={styles.achievementDesc}>
                        {hidden ? '???' : pickText(a.description, locale)}
                        {unlockedAt
                          ? ` — ${t('profile.unlocked', { date: dateFormat.format(unlockedAt) })}`
                          : ''}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <button
        type="button"
        className="btn btn-danger"
        onClick={() => {
          if (window.confirm(t('profile.resetConfirm'))) void profiles.resetProgress();
        }}
      >
        {t('profile.reset')}
      </button>
    </div>
  );
}
