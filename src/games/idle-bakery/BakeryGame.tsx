import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import styles from './Bakery.module.css';
import {
  ascend,
  buildingCps,
  BUILDINGS,
  buy,
  buyUpgrade,
  BY_BUILDING,
  click,
  clickGolden,
  cps,
  isBakery,
  newBakery,
  offline,
  prestigeFor,
  priceOf,
  shop,
  short,
  tick,
  type Bakery,
  type Upgrade,
} from './engine';
import { STRINGS } from './i18n';

interface Saved {
  b: Bakery;
  at: number;
}
const isSaved = (d: unknown): d is Saved =>
  typeof d === 'object' &&
  d !== null &&
  isBakery((d as Saved).b) &&
  typeof (d as Saved).at === 'number';

const SOUNDS: Record<string, SoundSpec> = {
  click: [{ wave: 'sine', freq: 320, freqEnd: 260, duration: 0.04, gain: 0.04 }],
  buy: [{ wave: 'triangle', freq: 660, duration: 0.06, gain: 0.07 }],
  upgrade: [
    { wave: 'triangle', freq: 784, duration: 0.07, gain: 0.08 },
    { wave: 'triangle', freq: 988, duration: 0.12, delay: 0.06, gain: 0.08 },
  ],
  golden: [{ wave: 'sine', freq: 1320, freqEnd: 1760, duration: 0.25, gain: 0.06 }],
  lucky: [
    { wave: 'triangle', freq: 1047, duration: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1319, duration: 0.08, delay: 0.08, gain: 0.12 },
    { wave: 'triangle', freq: 1568, duration: 0.2, delay: 0.16, gain: 0.12 },
  ],
  frenzy: [{ wave: 'sawtooth', freq: 440, freqEnd: 880, duration: 0.3, gain: 0.07 }],
  clickfrenzy: [{ wave: 'sawtooth', freq: 660, freqEnd: 1320, duration: 0.3, gain: 0.07 }],
  ascend: [
    { wave: 'sine', freq: 523, duration: 0.3, gain: 0.1 },
    { wave: 'sine', freq: 784, duration: 0.5, delay: 0.25, gain: 0.1 },
  ],
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function CookieArt({ golden = false }: { golden?: boolean }) {
  const chips = [
    [70, 72, 9],
    [128, 60, 8],
    [98, 108, 10],
    [150, 112, 9],
    [62, 140, 8],
    [118, 152, 9],
    [160, 158, 7],
    [92, 168, 6],
  ];
  return (
    <svg viewBox="0 0 220 220" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id={golden ? 'gold-dough' : 'dough'} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={golden ? '#fff3b0' : '#f1c27d'} />
          <stop offset="1" stopColor={golden ? '#e0a100' : '#c68642'} />
        </radialGradient>
      </defs>
      <path
        d="M110 12 C160 10 206 52 208 104 C210 160 168 206 112 208 C58 210 12 168 12 110 C12 56 58 14 110 12 Z"
        fill={`url(#${golden ? 'gold-dough' : 'dough'})`}
        stroke={golden ? '#a86b00' : '#8a5a2b'}
        strokeWidth="4"
      />
      {chips.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={golden ? '#fff' : '#4b2e1a'}
          opacity={golden ? 0.7 : 1}
        />
      ))}
    </svg>
  );
}

export function BakeryGame({ services }: GameProps) {
  const { locale } = services;
  const lang = locale === 'es' ? 'es' : 'en';
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const slot = useMemo(
    () => services.saveSlot<Saved>({ schema: 1, validate: isSaved }),
    [services],
  );
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
  const [b, setB] = useState<Bakery>(() => newBakery(seedFor()));
  const [loaded, setLoaded] = useState(false);
  const [bulk, setBulk] = useState<1 | 10>(1);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [news, setNews] = useState(0);
  // The authoritative state: several ticks or clicks can land between two renders.
  const bRef = useRef(b);
  const servicesRef = useLatest(services);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const startAllTime = useRef<number | null>(null);
  const floatId = useRef(0);
  const n = (x: number) => short(x, lang);
  const commit = (next: Bakery) => {
    bRef.current = next;
    setB(next);
  };

  const play = (events: string[]) => {
    for (const e of events) {
      const spec = SOUNDS[e];
      if (spec && e !== 'click') servicesRef.current.playSound(spec);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (cancelled) return;
      if (d) {
        const [after, earned] = offline(d.b, (Date.now() - d.at) / 1000);
        commit(after);
        if (earned >= 1) setMessage(t('welcome', { n: short(earned, lang) }));
        startAllTime.current = after.allTime;
      } else startAllTime.current = 0;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  // Time: a tick every 100 ms; a save every 5 s; achievements once a second.
  useEffect(() => {
    if (!loaded) return;
    let last = performance.now();
    let saveAt = last + 5000;
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      const next = tick(bRef.current, dt);
      play(next.events);
      commit(next);
      if (now >= saveAt) {
        saveAt = now + 5000;
        void slot.save({ b: next, at: Date.now() });
        const svc = servicesRef.current;
        if (next.allTime >= 1000) svc.unlockAchievement('batch');
        if (next.allTime >= 1e6) svc.unlockAchievement('million');
        if (next.allTime >= 1e9) svc.unlockAchievement('billion');
        if (next.clicks >= 1000) svc.unlockAchievement('clicker');
        if (Object.values(next.owned).reduce((a, x) => a + x, 0) >= 100)
          svc.unlockAchievement('tycoon');
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Save and record the session when leaving.
  useEffect(
    () => () => {
      const s = bRef.current;
      void slot.save({ b: s, at: Date.now() });
      if (startAllTime.current !== null && s.allTime > startAllTime.current)
        servicesRef.current.recordResult({
          outcome: 'complete',
          score: Math.floor(s.allTime),
          mode: 'classic',
        });
    },
    [bRef, servicesRef, slot],
  );

  useEffect(() => {
    const id = setInterval(() => setNews((x) => x + 1), 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(id);
  }, [message]);

  const onCookie = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const next = click(bRef.current);
    const gained = next.cookies - bRef.current.cookies;
    commit(next);
    servicesRef.current.playSound(SOUNDS.click!);
    const r = leftRef.current?.getBoundingClientRect();
    if (r && !services.reducedMotion) {
      const id = ++floatId.current;
      setFloats((f) => [
        ...f.slice(-12),
        { id, x: e.clientX - r.left, y: e.clientY - r.top, text: `+${short(gained, lang)}` },
      ]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
    }
  };

  const onGolden = () => {
    const next = clickGolden(bRef.current);
    commit(next);
    play(next.events);
    servicesRef.current.unlockAchievement('golden');
    const l = next.last;
    if (l)
      setMessage(
        l.effect === 'lucky'
          ? t('got.lucky', { n: short(l.amount, lang) })
          : t(`buff.${l.effect}`, { s: l.effect === 'frenzy' ? 77 : 13 }),
      );
  };

  const onAscend = () => {
    const gain = prestigeFor(b.allTime);
    if (gain <= b.prestige || !window.confirm(t('ascend.confirm', { n: gain }))) return;
    const next = ascend(b, seedFor());
    commit(next);
    play(next.events);
    servicesRef.current.unlockAchievement('ascend');
    void slot.save({ b: next, at: Date.now() });
  };

  const upgradeName = (u: Upgrade) => {
    if (u.kind === 'building')
      return t('u.tier', { b: t(`b.${u.building}`), n: ROMAN[Number(u.id.split('-')[1])]! });
    return t(`u.${u.id}`);
  };
  const upgradeDesc = (u: Upgrade) =>
    u.kind === 'building'
      ? t('u.tier.desc', { b: t(`b.${u.building}`) })
      : u.kind === 'click'
        ? t('u.pin.desc')
        : u.kind === 'clickcps'
          ? t('u.whisk.desc')
          : t(`u.${u.id}.desc`);
  const upgradeIcon = (u: Upgrade) =>
    u.kind === 'building'
      ? BY_BUILDING.get(u.building!)!.emoji
      : u.kind === 'click'
        ? '🥖'
        : u.kind === 'clickcps'
          ? '🥄'
          : '🍀';

  const perSecond = cps(b);
  const unlockedBuildings = BUILDINGS.filter(
    (x, i) =>
      i < 2 ||
      (b.owned[x.id] ?? 0) > 0 ||
      b.allTime >= x.price * 0.5 ||
      (b.owned[BUILDINGS[i - 1]!.id] ?? 0) > 0,
  );
  // Headlines follow progress: one per kind of building owned, cycling.
  const kinds = BUILDINGS.filter((x) => (b.owned[x.id] ?? 0) > 0).length;
  const newsKey = b.golden ? 'news.gold' : `news.${Math.min(11, news % (kinds + 1))}`;
  const buff = b.buffs.find((x) => x.until > b.t);
  const gain = prestigeFor(b.allTime) - b.prestige;

  return (
    <div className={styles.root} data-testid="ib-root">
      <div className={styles.left} ref={leftRef}>
        <div className={styles.news} aria-live="off" data-testid="ib-news">
          {t(newsKey)}
        </div>
        <div>{t('bakery')}</div>
        <div className={styles.count} data-testid="ib-cookies">
          {Math.floor(b.cookies + 1e-9) === 1 ? t('cookies.one') : t('cookies', { n: n(b.cookies) })}
        </div>
        <div className={styles.cps} data-testid="ib-cps">
          {t('perSecond', { n: short(perSecond, lang, true) })}
        </div>
        {buff && (
          <div className={styles.buff} data-testid="ib-buff">
            {t(`buff.${buff.kind}`, { s: Math.ceil(buff.until - b.t) })}
          </div>
        )}
        <button
          type="button"
          className={styles.cookie}
          onPointerDown={onCookie}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') &&
            (e.preventDefault(), commit(click(bRef.current)))
          }
          aria-label={t('cookie')}
          data-testid="ib-cookie"
        >
          <CookieArt />
        </button>
        {message && (
          <div className={styles.buff} role="status" data-testid="ib-message">
            {message}
          </div>
        )}
        {floats.map((f) => (
          <span key={f.id} className={styles.float} style={{ left: f.x, top: f.y }}>
            {f.text}
          </span>
        ))}
        {b.golden && (
          <button
            type="button"
            className={styles.golden}
            style={{ left: `${b.golden.x * 100}%`, top: `${b.golden.y * 100}%` }}
            onClick={onGolden}
            aria-label={t('golden')}
            data-testid="ib-golden"
          >
            <CookieArt golden />
          </button>
        )}
      </div>
      <div className={styles.right}>
        <div className={styles.panel}>
          <h3>{t('upgrades')}</h3>
          <div className={styles.upgrades}>
            {shop(b)
              .slice(0, 16)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={styles.upgrade}
                  disabled={b.cookies < u.price}
                  onClick={() => {
                    const next = buyUpgrade(bRef.current, u.id);
                    commit(next);
                    play(next.events);
                  }}
                  title={`${upgradeName(u)} — ${upgradeDesc(u)} ${t('cost', { n: n(u.price) })}`}
                  aria-label={`${upgradeName(u)}. ${upgradeDesc(u)} ${t('cost', { n: n(u.price) })}`}
                  data-testid={`ib-up-${u.id}`}
                >
                  {upgradeIcon(u)}
                  {u.kind === 'building' && <small>{ROMAN[Number(u.id.split('-')[1])]}</small>}
                </button>
              ))}
          </div>
        </div>
        <div className={styles.panel}>
          <h3>
            {t('buildings')}
            <span>
              <button
                type="button"
                className="btn btn-small"
                aria-pressed={bulk === 1}
                onClick={() => setBulk(1)}
              >
                {t('buy.1')}
              </button>{' '}
              <button
                type="button"
                className="btn btn-small"
                aria-pressed={bulk === 10}
                onClick={() => setBulk(10)}
                data-testid="ib-bulk-10"
              >
                {t('buy.10')}
              </button>
            </span>
          </h3>
          <div className={styles.buildings}>
            {unlockedBuildings.map((x) => {
              const price = priceOf(b, x.id, bulk);
              const owned = b.owned[x.id] ?? 0;
              return (
                <button
                  key={x.id}
                  type="button"
                  className={styles.building}
                  disabled={b.cookies < price}
                  onClick={() => {
                    const next = buy(bRef.current, x.id, bulk);
                    commit(next);
                    play(next.events);
                  }}
                  title={t(`d.${x.id}`)}
                  data-testid={`ib-buy-${x.id}`}
                >
                  <span className={styles.icon} aria-hidden="true">
                    {x.emoji}
                  </span>
                  <span>
                    <strong>{t(`b.${x.id}`)}</strong>
                    <small className={`${styles.price} ${b.cookies < price ? styles.short : ''}`}>
                      {n(price)}
                    </small>
                    {owned > 0 && (
                      <small>
                        {' '}
                        · {t('owned', { n: owned, c: short(buildingCps(b, x.id), lang, true) })}
                      </small>
                    )}
                  </span>
                  <span className={styles.owned}>{owned || ''}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.panel}>
          <h3>{t('stats')}</h3>
          <div className={styles.stats}>
            <span>{t('stat.baked')}</span>
            <strong>{n(b.baked)}</strong>
            <span>{t('stat.all')}</span>
            <strong>{n(b.allTime)}</strong>
            <span>{t('stat.clicks')}</span>
            <strong>{b.clicks}</strong>
            <span>{t('stat.handmade')}</span>
            <strong>{n(b.handmade)}</strong>
            <span>{t('stat.golden')}</span>
            <strong>{b.goldenClicks}</strong>
            <span>{t('stat.prestige', { n: b.prestige })}</span>
            <strong>{b.prestige}</strong>
          </div>
          <p>
            {gain > 0 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAscend}
                data-testid="ib-ascend"
              >
                {t('ascend', { n: gain })}
              </button>
            ) : (
              <small className="muted">{t('ascend.none')}</small>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
