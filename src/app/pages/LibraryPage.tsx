import { useMemo } from 'react';
import { GameGrid } from '../../components/GameCard';
import { pickText } from '../../core/i18n';
import type { CategoryId } from '../../data/roadmap';
import { MANIFESTS } from '../../games/registry';
import { useLocale, useProfile, useT } from '../platform';
import { navigate, type Route } from '../router';
import styles from './pages.module.css';

const CATEGORIES: CategoryId[] = ['board', 'strategy', 'cards', 'puzzle', 'dice', 'arcade'];
type Sort = 'number' | 'name' | 'recent';
type PlayerFilter = 'solo' | 'multi' | 'ai';

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function LibraryPage({ route }: { route: Route }) {
  const t = useT();
  const locale = useLocale();
  const profile = useProfile();
  const q = route.query.get('q') ?? '';
  const category = (route.query.get('category') as CategoryId | null) ?? null;
  const sort = (route.query.get('sort') as Sort | null) ?? 'number';
  const filter = (route.query.get('players') as PlayerFilter | null) ?? null;

  const update = (patch: Record<string, string | undefined>) => {
    const next = {
      q: q || undefined,
      category: category ?? undefined,
      sort: sort === 'number' ? undefined : sort,
      players: filter ?? undefined,
      ...patch,
    };
    navigate('/library', next, true);
  };

  const results = useMemo(() => {
    const needle = normalizeSearch(q.trim());
    const list = MANIFESTS.filter((m) => {
      if (category && m.category !== category) return false;
      if (filter === 'solo' && m.players.min > 1) return false;
      if (filter === 'multi' && m.players.max < 2) return false;
      if (filter === 'ai' && !m.vsComputer) return false;
      if (!needle) return true;
      const haystack = normalizeSearch(
        [
          m.title.en,
          m.title.es,
          m.tagline.en,
          m.tagline.es,
          m.genre.en,
          m.genre.es,
          ...(m.tags ?? []),
        ].join(' '),
      );
      return haystack.includes(needle);
    });
    const recentRank = new Map(profile.recent.map((r, i) => [r.gameId, i]));
    return list.sort((a, b) => {
      if (sort === 'name')
        return pickText(a.title, locale).localeCompare(pickText(b.title, locale), locale);
      if (sort === 'recent')
        return (recentRank.get(a.id) ?? 1e9) - (recentRank.get(b.id) ?? 1e9) || a.number - b.number;
      return a.number - b.number;
    });
  }, [q, category, filter, sort, locale, profile.recent]);

  return (
    <div className="page">
      <h1 className="page-title">{t('library.title')}</h1>
      <div className={styles.toolbar}>
        <label htmlFor="library-search" className="visually-hidden">
          {t('search.label')}
        </label>
        <input
          id="library-search"
          className={`input ${styles.searchInput}`}
          style={{ maxWidth: 360 }}
          type="search"
          placeholder={t('search.placeholder')}
          defaultValue={q}
          onChange={(e) => update({ q: e.target.value || undefined })}
        />
        <label htmlFor="library-sort" className="visually-hidden">
          {t('library.sort')}
        </label>
        <select
          id="library-sort"
          className="select"
          value={sort}
          onChange={(e) =>
            update({ sort: e.target.value === 'number' ? undefined : e.target.value })
          }
        >
          <option value="number">{t('library.sort.number')}</option>
          <option value="name">{t('library.sort.name')}</option>
          <option value="recent">{t('library.sort.recent')}</option>
        </select>
      </div>
      <div className={styles.chips} role="group" aria-label={t('home.categories')}>
        <button
          type="button"
          className="chip"
          aria-pressed={category === null}
          onClick={() => update({ category: undefined })}
        >
          {t('library.all')}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className="chip"
            aria-pressed={category === c}
            onClick={() => update({ category: category === c ? undefined : c })}
          >
            {t(`category.${c}`)}
          </button>
        ))}
      </div>
      <div className={styles.chips} role="group" aria-label={t('library.filter.multi')}>
        {(['solo', 'multi', 'ai'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className="chip"
            aria-pressed={filter === f}
            onClick={() => update({ players: filter === f ? undefined : f })}
          >
            {t(`library.filter.${f}`)}
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginBottom: 'var(--space-4)' }} aria-live="polite">
        {t('library.results', { count: results.length })}
      </p>
      {results.length > 0 ? (
        <GameGrid manifests={results} />
      ) : (
        <div className={styles.empty}>{t('library.empty')}</div>
      )}
    </div>
  );
}
