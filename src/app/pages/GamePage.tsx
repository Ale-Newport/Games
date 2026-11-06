import { ArrowLeft, BookOpen, Heart, Maximize, Volume2, VolumeX } from 'lucide-react';
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Modal } from '../../components/Modal';
import { UI_SOUNDS } from '../../core/audio/audio-engine';
import type { GameManifest, GameModule, GameServices } from '../../core/game-engine/types';
import { pickText } from '../../core/i18n';
import { unwrap, wrap } from '../../core/persistence/versioned';
import { findGame } from '../../games/registry';
import {
  useLocale,
  usePlatform,
  useProfile,
  useReducedMotion,
  useSettings,
  useT,
} from '../platform';
import { href } from '../router';
import styles from './GamePage.module.css';

export function GamePage({
  gameId,
  launchParams = {},
}: {
  gameId: string;
  launchParams?: Record<string, string>;
}) {
  const t = useT();
  const registration = findGame(gameId);
  if (!registration) {
    return (
      <div className="page">
        <h1 className="page-title">{t('game.notFound')}</h1>
        <a className="btn" href={href('/library')}>
          <ArrowLeft size={16} /> {t('game.back')}
        </a>
      </div>
    );
  }
  return (
    <LoadedGamePage
      key={gameId}
      manifest={registration.manifest}
      load={registration.load}
      launchParams={launchParams}
    />
  );
}

function LoadedGamePage({
  manifest,
  load,
  launchParams,
}: {
  manifest: GameManifest;
  load: () => Promise<GameModule>;
  launchParams: Record<string, string>;
}) {
  const t = useT();
  const locale = useLocale();
  const settings = useSettings();
  const reducedMotion = useReducedMotion();
  const profile = useProfile();
  const platform = usePlatform();
  const [module, setModule] = useState<GameModule | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const id = manifest.id;
  const title = pickText(manifest.title, locale);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (m) => !cancelled && setModule(m),
      (error: Error) => !cancelled && setLoadError(error),
    );
    platform.profiles.recordOpened(id);
    return () => {
      cancelled = true;
    };
  }, [id, load, platform.profiles, attempt]);

  useEffect(() => {
    document.title = `${title} · ${t('brand.name')}`;
    return () => {
      document.title = t('brand.name');
    };
  }, [title, t]);

  const services = useMemo<GameServices>(() => {
    const { profiles, audio, toasts } = platform;
    return {
      locale,
      reducedMotion,
      colorblind: settings.colorblind,
      profileName: profiles.getProfile().name,
      launchParams,
      playSound: (sound) => audio.play(sound),
      recordResult: (result) =>
        profiles.recordResult(id, result, manifest.scoring?.lowerIsBetter ?? false),
      getStats: () => profiles.getProfile().stats[id],
      unlockAchievement: (achievementId) => {
        const def = manifest.achievements.find((a) => a.id === achievementId);
        if (!def) throw new Error(`Unknown achievement ${achievementId} for ${id}`);
        if (profiles.unlockAchievement(id, achievementId)) {
          toasts.push({
            kind: 'achievement',
            title: t('achievement.unlocked'),
            body: pickText(def.title, locale),
          });
          audio.play(UI_SOUNDS.achievement);
        }
      },
      isAchievementUnlocked: (achievementId) =>
        Boolean(profiles.getProfile().achievements[id]?.[achievementId]),
      saveSlot: (spec) => ({
        load: async () => {
          const decoded = unwrap(spec, await profiles.readSave(id));
          if (!decoded.ok && decoded.reason !== 'missing')
            console.warn(`Discarding ${id} save: ${decoded.reason}`);
          return decoded.ok ? decoded.data : null;
        },
        save: (data) => profiles.writeSave(id, wrap(spec, data)),
        clear: () => profiles.clearSave(id),
      }),
    };
  }, [platform, locale, reducedMotion, settings.colorblind, id, manifest, t, launchParams]);

  const favorite = profile.favorites.includes(id);
  const Rules = module?.Rules;
  const Game = module?.Game;

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <a href={href('/library')} className="btn btn-ghost" aria-label={t('game.back')}>
          <ArrowLeft size={18} />
          <span className={styles.hideSm}>{t('game.back')}</span>
        </a>
        <h1 className={styles.title}>
          <span className={styles.number}>#{String(manifest.number).padStart(3, '0')}</span> {title}
        </h1>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-pressed={favorite}
            aria-label={favorite ? t('card.unfavorite') : t('card.favorite')}
            onClick={() => platform.profiles.toggleFavorite(id)}
          >
            <Heart
              size={18}
              fill={favorite ? 'currentColor' : 'none'}
              color={favorite ? '#ff5d8f' : 'currentColor'}
            />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label={settings.sound ? t('game.sound.on') : t('game.sound.off')}
            onClick={() => platform.settings.update({ sound: !settings.sound })}
          >
            {settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {manifest.fullscreen && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label={t('game.fullscreen')}
              onClick={() => void stageRef.current?.requestFullscreen?.()}
            >
              <Maximize size={18} />
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => setRulesOpen(true)}
            disabled={!Rules}
            aria-label={t('game.help')}
          >
            <BookOpen size={16} />
            <span className={styles.hideSm}>{t('game.help')}</span>
          </button>
        </div>
      </div>
      <div ref={stageRef} className={styles.stage} data-testid="game-stage">
        {loadError ? (
          <div className={styles.status} role="alert">
            <p>{t('game.error')}</p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setLoadError(null);
                setAttempt((n) => n + 1);
              }}
            >
              {t('game.reload')}
            </button>
          </div>
        ) : !Game ? (
          <div className={styles.status} aria-busy="true">
            <span className={styles.spinner} aria-hidden="true" />
            {t('game.loading')}
          </div>
        ) : (
          <GameErrorBoundary message={t('game.error')} retry={t('game.reload')}>
            <Game services={services} />
          </GameErrorBoundary>
        )}
      </div>
      <Modal
        open={rulesOpen}
        title={`${t('game.rules')} — ${title}`}
        onClose={() => setRulesOpen(false)}
        closeLabel={t('common.close')}
        size="lg"
      >
        {Rules && <Rules locale={locale} />}
      </Modal>
    </div>
  );
}

class GameErrorBoundary extends Component<
  { children: ReactNode; message: string; retry: string },
  { error: Error | null; key: number }
> {
  override state = { error: null as Error | null, key: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game crashed', error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className={styles.status} role="alert">
          <p>{this.props.message}</p>
          <button
            type="button"
            className="btn"
            onClick={() => this.setState((s) => ({ error: null, key: s.key + 1 }))}
          >
            {this.props.retry}
          </button>
        </div>
      );
    }
    return (
      <div key={this.state.key} className={styles.gameRoot}>
        {this.props.children}
      </div>
    );
  }
}
