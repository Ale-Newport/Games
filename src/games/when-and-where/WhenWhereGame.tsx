import { useEffect, useMemo, useState } from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import {
  currentScene,
  finished,
  MAX_PART,
  newPlay,
  ROUNDS,
  submit,
  total,
  type Play,
} from './engine';
import { STRINGS } from './i18n';
import { Panorama } from './Panorama';
import { PinMap } from './PinMap';
import { BY_SCENE, YEAR_MAX, YEAR_MIN } from './scenes';
import styles from './WhenWhere.module.css';

const SOUNDS: Record<string, SoundSpec> = {
  pin: [{ wave: 'sine', freq: 660, duration: 0.05, gain: 0.05 }],
  good: [
    { wave: 'triangle', freq: 784, duration: 0.1, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.2, delay: 0.09, gain: 0.12 },
  ],
  meh: [{ wave: 'triangle', freq: 523, duration: 0.2, gain: 0.08 }],
  bad: [{ wave: 'sine', freq: 300, freqEnd: 200, duration: 0.3, gain: 0.08 }],
  tick: [{ wave: 'square', freq: 1100, duration: 0.02, gain: 0.03 }],
};

export function WhenWhereGame({ services }: GameProps) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const [limit, setLimit] = useState(120);
  const [play, setPlay] = useState<Play | null>(null);
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [year, setYear] = useState(1950);
  const [revealed, setRevealed] = useState(false);
  const [left, setLeft] = useState(0);
  const servicesRef = useLatest(services);
  const playRef = useLatest(play);
  const pinRef = useLatest(pin);
  const yearRef = useLatest(year);
  const best = services.getStats()?.bestScore;
  const nf = new Intl.NumberFormat(locale);

  const guess = () => {
    const p = playRef.current;
    if (!p || revealed) return;
    const next = submit(p, {
      lat: pinRef.current?.[0] ?? null,
      lon: pinRef.current?.[1] ?? null,
      year: yearRef.current,
    });
    const r = next.results[next.results.length - 1]!;
    const pts = r.place + r.when;
    servicesRef.current.playSound(
      pts >= 7000 ? SOUNDS.good! : pts >= 3500 ? SOUNDS.meh! : SOUNDS.bad!,
    );
    const svc = servicesRef.current;
    if (pts >= 9000) svc.unlockAchievement('round-9000');
    if (r.when === MAX_PART) svc.unlockAchievement('exact-year');
    if (r.km !== null && r.km <= 50) svc.unlockAchievement('bullseye');
    setPlay(next);
    setRevealed(true);
    if (finished(next)) {
      const sum = total(next);
      svc.recordResult({
        outcome: 'complete',
        score: sum,
        mode: limit ? `timed-${limit}` : 'untimed',
      });
      if (sum >= 35000) svc.unlockAchievement('game-35000');
    }
  };

  // The round clock.
  useEffect(() => {
    if (!play || revealed || !play.limit || finished(play)) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          setTimeout(guess, 0);
          return 0;
        }
        if (l <= 11) servicesRef.current.playSound(SOUNDS.tick!);
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play?.results.length, revealed]);

  const start = () => {
    const seed =
      (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
    setPlay(newPlay(seed, limit));
    setPin(null);
    setYear(1950);
    setRevealed(false);
    setLeft(limit);
  };

  const next = () => {
    setPin(null);
    setYear(1950);
    setRevealed(false);
    setLeft(limit);
  };

  if (!play)
    return (
      <div className={styles.menu} data-testid="ww-menu">
        <h2>{t('title')}</h2>
        <p>{t('intro')}</p>
        <fieldset>
          <legend>{t('timer')}</legend>
          {[0, 60, 120].map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-small"
              aria-pressed={limit === s}
              onClick={() => setLimit(s)}
              data-testid={`ww-timer-${s}`}
            >
              {t(`timer.${s}`)}
            </button>
          ))}
        </fieldset>
        {best !== undefined && <p className="muted">{t('best', { n: nf.format(best) })}</p>}
        <button type="button" className="btn btn-primary" onClick={start} data-testid="ww-start">
          {t('start')}
        </button>
      </div>
    );

  if (finished(play) && !revealed)
    return (
      <div className={styles.wrap} data-testid="ww-summary">
        <h2>{t('total', { n: nf.format(total(play)), m: nf.format(ROUNDS * 2 * MAX_PART) })}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('col.scene')}</th>
              <th>{t('col.place')}</th>
              <th>{t('col.year')}</th>
            </tr>
          </thead>
          <tbody>
            {play.results.map((r) => {
              const s = BY_SCENE.get(r.scene)!;
              return (
                <tr key={r.scene}>
                  <td>
                    {locale === 'es' ? s.es : s.en}, {s.year}
                  </td>
                  <td>
                    {nf.format(r.place)}{' '}
                    {r.km !== null ? `(${nf.format(Math.round(r.km))} km)` : ''}
                  </td>
                  <td>
                    {nf.format(r.when)} ({r.guess.year})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPlay(null)}
          data-testid="ww-again"
        >
          {t('again')}
        </button>
      </div>
    );

  const shown = revealed
    ? BY_SCENE.get(play.results[play.results.length - 1]!.scene)!
    : currentScene(play)!;
  const last = revealed ? play.results[play.results.length - 1]! : null;
  const roundNo = play.results.length + (revealed ? 0 : 1);

  return (
    <div className={styles.wrap} data-testid="ww-play">
      <div className={styles.bar}>
        <span>{t('round', { n: roundNo, m: ROUNDS })}</span>
        <span data-testid="ww-total">{t('score', { n: nf.format(total(play)) })}</span>
        {play.limit > 0 && !revealed && (
          <span
            className={`${styles.timer} ${left <= 10 ? styles.low : ''}`}
            data-testid="ww-timer"
          >
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className={styles.layout}>
        <Panorama scene={shown} label={t('pano')} hint={t('look')} />
        <div className={styles.side}>
          <PinMap
            pin={
              revealed
                ? last!.guess.lat !== null
                  ? [last!.guess.lat, last!.guess.lon!]
                  : null
                : pin
            }
            truth={revealed ? [shown.lat, shown.lon] : null}
            onPin={
              revealed
                ? undefined
                : (lat, lon) => {
                    setPin([lat, lon]);
                    servicesRef.current.playSound(SOUNDS.pin!);
                  }
            }
            label={t('map')}
            zoomIn={t('zoomIn')}
            zoomOut={t('zoomOut')}
          />
          {!revealed ? (
            <>
              {!pin && <small className="muted">{t('pinFirst')}</small>}
              <div className={styles.year}>
                <div className={styles.yearRow}>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setYear((y) => Math.max(YEAR_MIN, y - 1))}
                    aria-label={t('earlier')}
                  >
                    −
                  </button>
                  <strong data-testid="ww-year">{year}</strong>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setYear((y) => Math.min(YEAR_MAX, y + 1))}
                    aria-label={t('later')}
                  >
                    +
                  </button>
                </div>
                <input
                  type="range"
                  min={YEAR_MIN}
                  max={YEAR_MAX}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  aria-label={t('year')}
                  data-testid="ww-year-range"
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={guess}
                disabled={!pin}
                data-testid="ww-guess"
              >
                {t('guess')}
              </button>
            </>
          ) : (
            <div className={styles.reveal} data-testid="ww-reveal">
              {last!.guess.lat === null && <p>{t('timeUp')}</p>}
              <h3>
                {t('answer', { place: locale === 'es' ? shown.es : shown.en, year: shown.year })}
              </h3>
              <p>
                {last!.km !== null
                  ? t('away', {
                      km: nf.format(Math.round(last!.km)),
                      off: Math.abs(last!.guess.year - shown.year),
                    })
                  : t('noPin', { off: Math.abs(last!.guess.year - shown.year) })}
                {last!.guess.year === shown.year && <strong> {t('exact')}</strong>}
              </p>
              <div className={styles.points} data-testid="ww-points">
                +{nf.format(last!.place + last!.when)}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => (finished(play) ? setRevealed(false) : next())}
                data-testid="ww-next"
              >
                {finished(play) ? t('results') : t('next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
