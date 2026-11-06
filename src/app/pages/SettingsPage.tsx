import type { Locale } from '../../core/i18n';
import type { MotionPreference, ThemePreference } from '../../core/settings/settings';
import { usePlatform, useSettings, useT } from '../platform';
import styles from './pages.module.css';

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const t = useT();
  const settings = useSettings();
  const { settings: store } = usePlatform();

  return (
    <div className="page">
      <h1 className="page-title">{t('settings.title')}</h1>
      <p className="page-subtitle">{t('settings.storage')}</p>
      <div className={styles.formGrid}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('settings.appearance')}</legend>
          <div className={styles.row}>
            <span>{t('settings.theme')}</span>
            <Segmented<ThemePreference>
              label={t('settings.theme')}
              value={settings.theme}
              onChange={(theme) => store.update({ theme })}
              options={(['system', 'dark', 'light'] as const).map((v) => ({
                value: v,
                label: t(`settings.theme.${v}`),
              }))}
            />
          </div>
          <div className={styles.row}>
            <span>{t('settings.language')}</span>
            <Segmented<Locale>
              label={t('settings.language')}
              value={settings.locale}
              onChange={(locale) => store.update({ locale })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
            />
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('settings.sound')}</legend>
          <div className={styles.row}>
            <label htmlFor="sound-toggle">{t('settings.soundEnabled')}</label>
            <input
              id="sound-toggle"
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => store.update({ sound: e.target.checked })}
              style={{ width: 22, height: 22 }}
            />
          </div>
          <div className={styles.row}>
            <label htmlFor="volume">{t('settings.volume')}</label>
            <input
              id="volume"
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => store.update({ volume: Number(e.target.value) / 100 })}
              disabled={!settings.sound}
              style={{ width: 200 }}
            />
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('settings.accessibility')}</legend>
          <div className={styles.row}>
            <span>{t('settings.motion')}</span>
            <Segmented<MotionPreference>
              label={t('settings.motion')}
              value={settings.motion}
              onChange={(motion) => store.update({ motion })}
              options={(['system', 'reduce', 'full'] as const).map((v) => ({
                value: v,
                label: t(`settings.motion.${v}`),
              }))}
            />
          </div>
          <div className={styles.row}>
            <label htmlFor="colorblind">
              {t('settings.colorblind')}
              <br />
              <small className="muted">{t('settings.colorblindHint')}</small>
            </label>
            <input
              id="colorblind"
              type="checkbox"
              checked={settings.colorblind}
              onChange={(e) => store.update({ colorblind: e.target.checked })}
              style={{ width: 22, height: 22 }}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
