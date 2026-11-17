import { RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import { randomSeed } from '../../core/game-engine/random';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import { Silhouette } from '../shared/world/Silhouette';
import styles from './Password.module.css';
import { FAMILY, RichEditor, type EditorApi } from './RichEditor';
import {
  BUG,
  clockOf,
  confirm,
  edit,
  EGG,
  FONTS,
  isPw,
  metCount,
  MOONS,
  newCaptcha,
  newColour,
  newPw,
  passing,
  RULES,
  SIZES,
  SPONSORS,
  STRONG,
  tick,
  type Font,
  type Pw,
} from './rules';
import { STRINGS } from './i18n';

const SOUNDS: Record<string, SoundSpec> = {
  rule: [{ wave: 'sine', freq: 660, duration: 0.08, gain: 0.06 }],
  fire: [{ wave: 'noise', freq: 0, duration: 0.4, gain: 0.08, lowpass: 900 }],
  spread: [{ wave: 'noise', freq: 0, duration: 0.12, gain: 0.04, lowpass: 700 }],
  extinguished: [{ wave: 'sine', freq: 400, freqEnd: 800, duration: 0.2, gain: 0.07 }],
  hatch: [
    { wave: 'triangle', freq: 1200, duration: 0.06, gain: 0.08 },
    { wave: 'triangle', freq: 1500, duration: 0.08, delay: 0.08, gain: 0.08 },
  ],
  eat: [{ wave: 'square', freq: 300, duration: 0.05, gain: 0.05 }],
  final: [{ wave: 'triangle', freq: 784, duration: 0.2, gain: 0.1 }],
  lost: [{ wave: 'sawtooth', freq: 260, freqEnd: 70, duration: 0.7, gain: 0.1 }],
  win: [
    { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.18 },
    { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.1, gain: 0.18 },
    { wave: 'triangle', freq: 784, duration: 0.12, delay: 0.2, gain: 0.18 },
    { wave: 'triangle', freq: 1047, duration: 0.4, delay: 0.3, gain: 0.2 },
  ],
};

const SPONSOR_STYLE: Record<string, React.CSSProperties> = {
  zorbo: {
    background: '#ff5a36',
    color: '#fff',
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
  },
  quixa: {
    background: '#1f6feb',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    textTransform: 'uppercase',
  },
  blimpo: { background: '#ffd23f', color: '#222', fontFamily: 'ui-monospace, monospace' },
};

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function captchaLayout(text: string) {
  let h = hash(text);
  const r = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    return (h % 1000) / 1000;
  };
  const chars = [...text].map((c, i) => ({
    c,
    x: 18 + i * 30,
    y: 38 + (r() - 0.5) * 12,
    rot: (r() - 0.5) * 50,
  }));
  const lines = Array.from(
    { length: 5 },
    () => [r() * 180, r() * 60, r() * 180, r() * 60] as const,
  );
  return { chars, lines };
}

function Captcha({ text, label }: { text: string; label: string }) {
  const { chars, lines } = captchaLayout(text);
  return (
    <svg
      className={styles.captcha}
      width="180"
      height="60"
      viewBox="0 0 180 60"
      role="img"
      aria-label={label}
    >
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8a7f6a" strokeWidth="1.5" />
      ))}
      {chars.map((k, i) => (
        <text
          key={i}
          x={k.x}
          y={k.y}
          fontSize="28"
          fontFamily="Georgia, serif"
          fill="#3b3428"
          transform={`rotate(${k.rot} ${k.x} ${k.y})`}
        >
          {k.c}
        </text>
      ))}
    </svg>
  );
}

export function PasswordGame({ services }: GameProps) {
  const t = useMemo(() => createTranslator(STRINGS, services.locale), [services.locale]);
  const slot = useMemo(() => services.saveSlot<Pw>({ schema: 1, validate: isPw }), [services]);
  const seedFor = () =>
    (services.launchParams.deal ? Number(services.launchParams.deal) : randomSeed()) >>> 0;
  const [pw, setPw] = useState<Pw>(() => newPw(seedFor(), clockOf(new Date())));
  const [loaded, setLoaded] = useState(false);
  const [asking, setAsking] = useState(false);
  const [retype, setRetype] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [font, setFont] = useState<Font>('sans');
  const [size, setSize] = useState(28);
  const editor = useRef<EditorApi | null>(null);
  const servicesRef = useLatest(services);
  const pwRef = useLatest(pw);

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (cancelled) return;
      if (d && !d.won && !d.lost) setPw(d);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  useEffect(() => {
    if (loaded) void slot.save(pw);
  }, [pw, loaded, slot]);

  const update = (next: Pw) => {
    const prev = pwRef.current;
    setPw(next);
    for (const e of next.events) {
      const spec = SOUNDS[e];
      if (spec) servicesRef.current.playSound(spec);
    }
    const svc = servicesRef.current;
    if (next.shown >= 10 && prev.shown < 10) svc.unlockAchievement('rule-10');
    if (next.paul === 'chicken' && prev.paul !== 'chicken') svc.unlockAchievement('paul');
    if (next.fire === 'out' && prev.fire === 'burning') svc.unlockAchievement('fire');
    if (next.lost && !prev.lost) {
      svc.recordResult({ outcome: 'loss', score: metCount(next), mode: 'classic' });
      void slot.clear();
    }
    if (next.won && !prev.won) {
      svc.unlockAchievement('win');
      if (next.t <= 15 * 60) svc.unlockAchievement('fast');
      svc.recordResult({
        outcome: 'win',
        score: RULES.length,
        timeMs: next.t * 1000,
        mode: 'classic',
      });
      void slot.clear();
    }
    if (!next.final) setAsking(false);
  };

  // One second at a time: the fire spreads, Paul gets hungry, the clock moves.
  useEffect(() => {
    const id = setInterval(() => {
      const p = pwRef.current;
      if (p.lost || p.won) return;
      update(tick(p, clockOf(new Date())));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = () => {
    setAsking(false);
    setRetype('');
    update(newPw(seedFor(), clockOf(new Date())));
  };

  const results = passing(pw);
  const order = RULES.slice(0, pw.shown)
    .map((r, i) => ({ r, i, ok: results[i]! }))
    .sort((a, b) => Number(a.ok) - Number(b.ok) || b.i - a.i);
  const over = pw.won || !!pw.lost;
  const minutes = `${Math.floor(pw.t / 60)}:${String(pw.t % 60).padStart(2, '0')}`;

  const extra = (id: string) => {
    if (id === 'sponsor')
      return (
        <div className={styles.extra}>
          {SPONSORS.map((s) => (
            <span key={s} className={styles.sponsor} style={SPONSOR_STYLE[s]}>
              {s[0]!.toUpperCase() + s.slice(1)}
            </span>
          ))}
        </div>
      );
    if (id === 'captcha')
      return (
        <div className={styles.extra}>
          <Captcha text={pw.captcha} label={t('captcha')} />
          <button
            type="button"
            className="btn btn-small"
            onClick={() => update(newCaptcha(pwRef.current))}
            data-testid="pw-captcha-refresh"
          >
            <RotateCcw size={14} /> {t('refresh')}
          </button>
          <span hidden data-testid="pw-captcha">
            {pw.captcha}
          </span>
        </div>
      );
    if (id === 'country')
      return (
        <div className={styles.extra}>
          <Silhouette iso2={pw.country} className={styles.shape} size={180} label={t('shape')} />
        </div>
      );
    if (id === 'hex')
      return (
        <div className={styles.extra}>
          <div
            className={styles.swatch}
            style={{ background: `#${pw.hex}` }}
            role="img"
            aria-label={t('colour')}
            data-testid="pw-swatch"
          />
          <button
            type="button"
            className="btn btn-small"
            onClick={() => update(newColour(pwRef.current))}
            data-testid="pw-colour-refresh"
          >
            <RotateCcw size={14} /> {t('refresh')}
          </button>
        </div>
      );
    return null;
  };

  const keep = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className={styles.root} data-testid="pw-root">
      <div className={styles.head}>
        <h2>{t('intro')}</h2>
        <span data-testid="pw-met">{t('met', { n: metCount(pw), m: pw.shown })}</span>
      </div>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.tool}
          style={{ fontWeight: 700 }}
          onMouseDown={keep}
          onClick={() => editor.current?.format((c, all) => ({ ...c, b: !all.every((x) => x.b) }))}
          aria-label={t('bold')}
          title={t('bold')}
          data-testid="pw-bold"
        >
          B
        </button>
        <button
          type="button"
          className={styles.tool}
          style={{ fontStyle: 'italic' }}
          onMouseDown={keep}
          onClick={() => editor.current?.format((c, all) => ({ ...c, i: !all.every((x) => x.i) }))}
          aria-label={t('italic')}
          title={t('italic')}
          data-testid="pw-italic"
        >
          I
        </button>
        <select
          value={font}
          aria-label={t('font')}
          onChange={(e) => {
            const f = e.target.value as Font;
            setFont(f);
            editor.current?.format((c) => ({ ...c, f }));
          }}
          data-testid="pw-font"
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: FAMILY[f] }}>
              {t(`font.${f}`)}
            </option>
          ))}
        </select>
        <select
          value={size}
          aria-label={t('size')}
          onChange={(e) => {
            const s = Number(e.target.value);
            setSize(s);
            editor.current?.format((c) => ({ ...c, s }));
          }}
          data-testid="pw-size"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
        {[EGG, BUG, STRONG, ...MOONS].map((e) => (
          <button
            type="button"
            key={e}
            className={styles.tool}
            onMouseDown={keep}
            onClick={() => editor.current?.insert(e)}
            aria-label={t('emoji', { e })}
            data-testid={`pw-emoji-${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className={styles.box}>
        <RichEditor
          chars={pw.chars}
          onChange={(chars) => update(edit(pwRef.current, chars))}
          disabled={over}
          label={t('field')}
          apiRef={editor}
        />
        <span className={styles.count} data-testid="pw-length">
          {pw.chars.length}
        </span>
      </div>
      {pw.won && (
        <div className={`${styles.end} ${styles.won}`} data-testid="pw-end">
          <p>{t('won', { t: minutes })}</p>
          <button type="button" className="btn btn-primary" onClick={restart}>
            {t('restart')}
          </button>
        </div>
      )}
      {pw.lost && (
        <div className={`${styles.end} ${styles.lost}`} data-testid="pw-end">
          <p>{t(`lost.${pw.lost}`)}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={restart}
            data-testid="pw-restart"
          >
            {t('restart')}
          </button>
        </div>
      )}
      {pw.final && !over && (
        <div className={styles.final} data-testid="pw-final">
          <strong>{t('final.ask')}</strong>
          {!asking ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAsking(true)}
              data-testid="pw-final-yes"
            >
              {t('final.yes')}
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const next = confirm(pwRef.current, retype);
                setMismatch(!next.won);
                update(next);
              }}
            >
              <label>
                {t('final.retype')}{' '}
                <input
                  value={retype}
                  onChange={(e) => setRetype(e.target.value)}
                  data-testid="pw-retype"
                  autoComplete="off"
                />
              </label>{' '}
              <button type="submit" className="btn btn-primary" data-testid="pw-final-confirm">
                {t('final.confirm')}
              </button>
              {mismatch && <p role="alert">{t('final.mismatch')}</p>}
            </form>
          )}
        </div>
      )}
      <div className={styles.rules} aria-live="polite">
        {order.map(({ r, i, ok }) => (
          <section
            key={r.id}
            className={`${styles.rule} ${ok ? styles.ok : styles.bad}`}
            data-testid={`pw-rule-${r.id}`}
            data-ok={ok}
          >
            <header>
              {ok ? '✔' : '✘'} {t('rule', { n: i + 1 })}
            </header>
            <div>
              {t(`r.${r.id}`)}
              {extra(r.id)}
            </div>
          </section>
        ))}
      </div>
      {!over && (
        <div>
          <button type="button" className="btn" onClick={restart} data-testid="pw-restart-run">
            <RotateCcw size={16} /> {t('restart')}
          </button>
        </div>
      )}
    </div>
  );
}
