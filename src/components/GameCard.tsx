import { Bot, Heart, Play, RotateCcw, Users } from 'lucide-react';
import { href } from '../app/router';
import { useLocale, usePlatform, useProfile, useT } from '../app/platform';
import { pickText } from '../core/i18n';
import type { GameManifest } from '../core/game-engine/types';
import styles from './GameCard.module.css';

export function playersLabel(t: ReturnType<typeof useT>, players: GameManifest['players']): string {
  if (players.min === players.max)
    return t(players.min === 1 ? 'card.player' : 'card.playersN', { n: players.min });
  return t('card.players', { min: players.min, max: players.max });
}

export function GameCard({ manifest }: { manifest: GameManifest }) {
  const t = useT();
  const locale = useLocale();
  const profile = useProfile();
  const { profiles } = usePlatform();
  const stats = profile.stats[manifest.id];
  const favorite = profile.favorites.includes(manifest.id);
  const hasSave = manifest.id in profile.saves;
  const title = pickText(manifest.title, locale);
  const gameHref = href(`/game/${manifest.id}`);

  let record: string | null = null;
  if (stats && manifest.scoring && stats.bestScore !== undefined) {
    record = t('card.best', { value: stats.bestScore });
  } else if (stats && stats.played > 0) {
    record = t('card.record', { wins: stats.wins, losses: stats.losses, draws: stats.draws });
  }

  return (
    <article className={styles.card} data-testid={`game-card-${manifest.id}`}>
      <a href={gameHref} className={styles.previewLink} tabIndex={-1} aria-hidden="true">
        <img
          className={styles.preview}
          src={manifest.preview}
          alt=""
          loading="lazy"
          width={320}
          height={200}
        />
        <span className={styles.number}>#{String(manifest.number).padStart(3, '0')}</span>
      </a>
      <button
        type="button"
        className={`${styles.favorite} ${favorite ? styles.favoriteOn : ''}`}
        aria-pressed={favorite}
        aria-label={favorite ? t('card.unfavorite') : t('card.favorite')}
        onClick={() => profiles.toggleFavorite(manifest.id)}
      >
        <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
      </button>
      <div className={styles.body}>
        <p className={styles.category}>
          {t(`category.${manifest.category}`)} · {pickText(manifest.genre, locale)}
        </p>
        <h3 className={styles.title}>
          <a href={gameHref}>{title}</a>
        </h3>
        <p className={styles.tagline}>{pickText(manifest.tagline, locale)}</p>
        <ul className={styles.meta}>
          <li>
            <Users size={14} aria-hidden="true" /> {playersLabel(t, manifest.players)}
          </li>
          {manifest.vsComputer && (
            <li>
              <Bot size={14} aria-hidden="true" /> {t('card.vsComputer')}
            </li>
          )}
          <li
            className={styles.complexity}
            title={t('card.complexity', { n: manifest.complexity })}
          >
            <span className="visually-hidden">
              {t('card.complexity', { n: manifest.complexity })}
            </span>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                aria-hidden="true"
                className={n <= manifest.complexity ? styles.dotOn : styles.dot}
              />
            ))}
          </li>
        </ul>
        <div className={styles.footer}>
          <span className={styles.record}>{record}</span>
          <a
            href={gameHref}
            className="btn btn-primary"
            aria-label={`${t(hasSave ? 'card.continue' : 'card.play')}: ${title}`}
          >
            {hasSave ? <RotateCcw size={16} /> : <Play size={16} />}
            {t(hasSave ? 'card.continue' : 'card.play')}
          </a>
        </div>
      </div>
    </article>
  );
}

export function GameGrid({ manifests }: { manifests: readonly GameManifest[] }) {
  return (
    <div className={styles.grid}>
      {manifests.map((m) => (
        <GameCard key={m.id} manifest={m} />
      ))}
    </div>
  );
}
