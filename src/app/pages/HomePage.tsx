import { ArrowRight, Bot, Search } from 'lucide-react';
import { useState } from 'react';
import { GameGrid } from '../../components/GameCard';
import { ROADMAP, type CategoryId } from '../../data/roadmap';
import { MANIFESTS } from '../../games/registry';
import { useProfile, useT } from '../platform';
import { href, navigate } from '../router';
import styles from './pages.module.css';

const CATEGORIES: CategoryId[] = ['board', 'strategy', 'cards', 'puzzle', 'dice', 'arcade'];

export function HomePage() {
  const t = useT();
  const profile = useProfile();
  const [query, setQuery] = useState('');
  const byId = new Map(MANIFESTS.map((m) => [m.id, m]));
  const continuing = Object.entries(profile.saves)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => byId.get(id))
    .filter((m) => m !== undefined);
  const recent = profile.recent.map((r) => byId.get(r.gameId)).filter((m) => m !== undefined);
  const favorites = profile.favorites.map((id) => byId.get(id)).filter((m) => m !== undefined);
  const totals = Object.values(profile.stats).reduce(
    (acc, s) => ({ played: acc.played + s.played, wins: acc.wins + s.wins + s.completions }),
    { played: 0, wins: 0 },
  );
  const achievementCount = Object.values(profile.achievements).reduce(
    (n, a) => n + Object.keys(a).length,
    0,
  );
  const available = MANIFESTS.length;

  return (
    <div className="page">
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{t('brand.name')}</h1>
        <p className={styles.heroText}>{t('brand.tagline')}</p>
        <form
          className={styles.searchForm}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/library', { q: query.trim() || undefined });
          }}
        >
          <label htmlFor="home-search" className="visually-hidden">
            {t('search.label')}
          </label>
          <input
            id="home-search"
            className={styles.searchInput}
            type="search"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-icon" aria-label={t('search.label')}>
            <Search size={18} />
          </button>
        </form>
        <div className={styles.heroActions}>
          <a className="btn btn-primary" href={href('/library')}>
            {t('home.browseAll')} <ArrowRight size={16} />
          </a>
          <a className="btn" href={href('/ai-lab')}>
            <Bot size={16} /> {t('nav.aiLab')}
          </a>
        </div>
      </section>

      {continuing.length > 0 && (
        <section className={styles.section} aria-labelledby="continue-title">
          <div className={styles.sectionHeader}>
            <h2 id="continue-title" className={styles.sectionTitle}>
              {t('home.continue')}
            </h2>
          </div>
          <GameGrid manifests={continuing} />
        </section>
      )}

      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.sectionHeader}>
          <h2 id="featured-title" className={styles.sectionTitle}>
            {t('home.featured')}
          </h2>
          <a className={styles.sectionLink} href={href('/library')}>
            {t('home.browseAll')} →
          </a>
        </div>
        <GameGrid manifests={MANIFESTS.slice(0, 8)} />
      </section>

      {recent.length > 0 && (
        <section className={styles.section} aria-labelledby="recent-title">
          <div className={styles.sectionHeader}>
            <h2 id="recent-title" className={styles.sectionTitle}>
              {t('home.recent')}
            </h2>
          </div>
          <GameGrid manifests={recent.slice(0, 4)} />
        </section>
      )}

      {favorites.length > 0 && (
        <section className={styles.section} aria-labelledby="fav-title">
          <div className={styles.sectionHeader}>
            <h2 id="fav-title" className={styles.sectionTitle}>
              {t('home.favorites')}
            </h2>
          </div>
          <GameGrid manifests={favorites} />
        </section>
      )}

      <section className={styles.section} aria-labelledby="progress-title">
        <div className={styles.sectionHeader}>
          <h2 id="progress-title" className={styles.sectionTitle}>
            {t('home.progress')}
          </h2>
          <a className={styles.sectionLink} href={href('/profile')}>
            {t('nav.profile')} →
          </a>
        </div>
        <div className={styles.statsRow}>
          <Stat label={t('home.stats.played')} value={totals.played} />
          <Stat label={t('home.stats.wins')} value={totals.wins} />
          <Stat label={t('home.stats.achievements')} value={achievementCount} />
          <Stat label={t('home.stats.favorites')} value={profile.favorites.length} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="cat-title">
        <div className={styles.sectionHeader}>
          <h2 id="cat-title" className={styles.sectionTitle}>
            {t('home.categories')}
          </h2>
        </div>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((category) => {
            const planned = ROADMAP.filter((r) => r.category === category).length;
            const ready = MANIFESTS.filter((m) => m.category === category).length;
            return (
              <a
                key={category}
                className={styles.categoryTile}
                href={href('/library', { category })}
              >
                <span className={styles.categoryName}>{t(`category.${category}`)}</span>
                <span className={styles.categoryCount}>
                  {ready} / {planned}
                </span>
              </a>
            );
          })}
        </div>
        <div className="panel" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <strong>{t('home.available', { count: available, total: ROADMAP.length })}</strong>
          <div className={styles.progressBar} aria-hidden="true">
            <div
              className={styles.progressFill}
              style={{ width: `${(available / ROADMAP.length) * 100}%` }}
            />
          </div>
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            {t('home.availableHint')}{' '}
            <a href={href('/roadmap')} className={styles.sectionLink}>
              {t('home.viewRoadmap')} →
            </a>
          </p>
        </div>
      </section>

      <section className={styles.teaser}>
        <div>
          <h2>{t('home.aiTeaser.title')}</h2>
          <p className="muted">{t('home.aiTeaser.body')}</p>
        </div>
        <a className="btn btn-primary" href={href('/ai-lab')}>
          <Bot size={16} /> {t('home.aiTeaser.cta')}
        </a>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statTile}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
