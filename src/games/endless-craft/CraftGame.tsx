import { Lightbulb, RotateCcw, Trash2 } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { SoundSpec } from '../../core/audio/audio-engine';
import { useLatest } from '../../core/game-engine/hooks';
import type { GameProps } from '../../core/game-engine/types';
import { createTranslator } from '../../core/i18n';
import styles from './Craft.module.css';
import {
  clearChips,
  combine,
  dropOn,
  duplicate,
  ELEMENT_IDS,
  ELEMENTS,
  isCraft,
  MADE_FROM,
  moveChip,
  newCraft,
  place,
  removeChip,
  type Craft,
} from './engine';
import { STRINGS } from './i18n';

const SOUNDS: Record<string, SoundSpec> = {
  place: [{ wave: 'sine', freq: 520, duration: 0.04, gain: 0.04 }],
  made: [{ wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.12, gain: 0.08 }],
  fresh: [
    { wave: 'triangle', freq: 784, duration: 0.09, gain: 0.12 },
    { wave: 'triangle', freq: 1175, duration: 0.2, delay: 0.08, gain: 0.12 },
  ],
  nothing: [{ wave: 'sine', freq: 200, freqEnd: 150, duration: 0.1, gain: 0.05 }],
};

const MILESTONES: [number, string][] = [
  [25, 'found-25'],
  [50, 'found-50'],
  [100, 'found-100'],
  [150, 'found-150'],
];

interface Drag {
  pointer: number;
  /** A chip on the space, or a new one dragged out of the list. */
  uid: number | null;
  id: string;
  sx: number;
  sy: number;
  x: number;
  y: number;
  /** The pointer relative to the crafting space. */
  lx: number;
  ly: number;
  moved: boolean;
}

export function CraftGame({ services }: GameProps) {
  const { locale } = services;
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const slot = useMemo(
    () => services.saveSlot<Craft>({ schema: 1, validate: isCraft }),
    [services],
  );
  const [craft, setCraft] = useState<Craft>(newCraft);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'time' | 'name'>('time');
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const [popUid, setPopUid] = useState<number | null>(null);
  const spaceRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLDivElement | null>(null);
  const servicesRef = useLatest(services);
  const startCount = useRef<number | null>(null);
  const craftRef = useLatest(craft);
  const name = (id: string) =>
    `${ELEMENTS[id]!.emoji} ${locale === 'es' ? ELEMENTS[id]!.es : ELEMENTS[id]!.en}`;

  useEffect(() => {
    let cancelled = false;
    void slot.load().then((d) => {
      if (cancelled) return;
      if (d) setCraft(d);
      startCount.current = (d ?? newCraft()).found.length;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  // Keep the save current; record the session's progress when leaving.
  useEffect(() => {
    if (loaded) void slot.save(craft);
  }, [craft, loaded, slot]);
  useEffect(
    () => () => {
      const c = craftRef.current;
      if (startCount.current !== null && c.found.length > startCount.current)
        servicesRef.current.recordResult({
          outcome: 'complete',
          score: c.found.length,
          mode: 'sandbox',
        });
    },
    [craftRef, servicesRef],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const say = (text: string) => setToast((p) => ({ text, key: (p?.key ?? 0) + 1 }));

  const apply = (next: Craft) => {
    const prev = craftRef.current;
    setCraft(next);
    if (next.last && next.last !== prev.last) {
      const l = next.last;
      if (!l.out) {
        servicesRef.current.playSound(SOUNDS.nothing!);
        say(t('toast.nothing'));
      } else {
        servicesRef.current.playSound(l.fresh ? SOUNDS.fresh! : SOUNDS.made!);
        say(l.fresh ? t('toast.new', { e: name(l.out) }) : t('toast.made', { e: name(l.out) }));
        setPopUid(next.nextUid - 1);
        if (l.fresh) {
          const n = next.found.length;
          const unlock = (id: string) => servicesRef.current.unlockAchievement(id);
          unlock('first');
          for (const [m, id] of MILESTONES) if (n >= m) unlock(id);
          if (l.out === 'dragon') unlock('dragon');
          if (l.out === 'ai') unlock('ai');
          if (n === ELEMENT_IDS.length) {
            unlock('all');
            servicesRef.current.recordResult({ outcome: 'complete', score: n, mode: 'sandbox' });
            startCount.current = n;
          }
        }
      }
    }
  };

  /** Fractional position in the space for a client point, or null outside it. */
  const inSpace = (cx: number, cy: number): [number, number] | null => {
    const r = spaceRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return null;
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    return [(cx - r.left) / r.width, (cy - r.top) / r.height];
  };

  const overSide = (cx: number, cy: number) => {
    const r = sideRef.current?.getBoundingClientRect();
    return !!r && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  };

  /** The chip under a client point (other than `except`), by distance between centres. */
  const chipAt = (c: Craft, fx: number, fy: number, except: number | null) => {
    const r = spaceRef.current?.getBoundingClientRect();
    if (!r) return null;
    let best: number | null = null;
    let bestD = 46;
    for (const k of c.chips) {
      if (k.uid === except) continue;
      const d = Math.hypot((k.x - fx) * r.width, (k.y - fy) * r.height);
      if (d < bestD) {
        bestD = d;
        best = k.uid;
      }
    }
    return best;
  };

  /** A free-ish spot for a tapped element: a spiral around the centre. */
  const freeSpot = (c: Craft): [number, number] => {
    for (let i = 0; i < 60; i++) {
      const a = i * 2.4;
      const rr = 0.04 + i * 0.012;
      const x = 0.5 + Math.cos(a) * rr * 1.3;
      const y = 0.5 + Math.sin(a) * rr * 1.6;
      if (x < 0.06 || x > 0.94 || y < 0.06 || y > 0.94) continue;
      if (c.chips.every((k) => Math.hypot(k.x - x, k.y - y) > 0.09)) return [x, y];
    }
    return [0.5, 0.5];
  };

  const startDrag = (e: ReactPointerEvent<HTMLElement>, uid: number | null, id: string) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({
      pointer: e.pointerId,
      uid,
      id,
      sx: e.clientX,
      sy: e.clientY,
      x: e.clientX,
      y: e.clientY,
      lx: 0,
      ly: 0,
      moved: false,
    });
  };

  const moveDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6;
    const r = spaceRef.current?.getBoundingClientRect();
    setDrag({
      ...drag,
      x: e.clientX,
      y: e.clientY,
      lx: e.clientX - (r?.left ?? 0),
      ly: e.clientY - (r?.top ?? 0),
      moved,
    });
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    setDrag(null);
    const c = craftRef.current;
    if (!drag.moved) {
      // A tap on a list item places it; a tap on a chip selects it (or combines with the selection).
      if (drag.uid === null) {
        const [x, y] = freeSpot(c);
        apply(place(c, drag.id, x, y));
        servicesRef.current.playSound(SOUNDS.place!);
      } else tapChip(drag.uid);
      return;
    }
    if (drag.uid !== null && overSide(e.clientX, e.clientY)) {
      apply(removeChip(c, drag.uid));
      return;
    }
    const at = inSpace(e.clientX, e.clientY);
    if (!at) return;
    let next: Craft;
    let uid = drag.uid;
    if (uid === null) {
      next = place(c, drag.id, at[0], at[1]);
      uid = next.nextUid - 1;
    } else next = moveChip(c, uid, at[0], at[1]);
    const target = chipAt(next, at[0], at[1], uid);
    if (target !== null) next = dropOn(next, uid, target);
    else if (drag.uid === null) servicesRef.current.playSound(SOUNDS.place!);
    apply(next);
  };

  const tapChip = (uid: number) => {
    if (selected === null || selected === uid) {
      setSelected(selected === uid ? null : uid);
      return;
    }
    setSelected(null);
    apply(dropOn(craftRef.current, selected, uid));
  };

  const chipKey = (e: KeyboardEvent<HTMLElement>, uid: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tapChip(uid);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      apply(removeChip(craftRef.current, uid));
      if (selected === uid) setSelected(null);
    } else if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      apply(duplicate(craftRef.current, uid));
    }
  };

  const itemKey = (e: KeyboardEvent<HTMLElement>, id: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const c = craftRef.current;
    const [x, y] = freeSpot(c);
    apply(place(c, id, x, y));
  };

  const hint = () => {
    const found = new Set(craft.found);
    for (const id of ELEMENT_IDS) {
      if (found.has(id)) continue;
      for (const [a, b] of MADE_FROM.get(id) ?? []) {
        if (found.has(a) && found.has(b) && combine(a, b) === id) {
          say(t('hint.text', { e: name(a) }));
          return;
        }
      }
    }
    say(
      craft.found.length === ELEMENT_IDS.length
        ? t('hint.all', { n: ELEMENT_IDS.length })
        : t('hint.none'),
    );
  };

  const reset = () => {
    if (!window.confirm(t('reset.confirm'))) return;
    setSelected(null);
    setCraft(newCraft());
  };

  const label = (id: string) => (locale === 'es' ? ELEMENTS[id]!.es : ELEMENTS[id]!.en);
  const q = query.trim().toLowerCase();
  const items = craft.found
    .filter(
      (id) =>
        !q || label(id).toLowerCase().includes(q) || ELEMENTS[id]!.en.toLowerCase().includes(q),
    )
    .sort(sort === 'name' ? (a, b) => label(a).localeCompare(label(b), locale) : () => 0);
  const ghostFor = drag && drag.moved && drag.uid === null ? drag : null;
  return (
    <div className={styles.root} data-testid="ec-root">
      <div className={styles.bar}>
        <strong data-testid="ec-count">
          {t('found', { n: craft.found.length, total: ELEMENT_IDS.length })}
        </strong>
        <div className={styles.tools}>
          <button type="button" className="btn" onClick={hint} data-testid="ec-hint">
            <Lightbulb size={16} /> {t('hint')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => apply(clearChips(craftRef.current))}
            data-testid="ec-clear"
          >
            <Trash2 size={16} /> {t('clear')}
          </button>
          <button type="button" className="btn" onClick={reset} data-testid="ec-reset">
            <RotateCcw size={16} /> {t('reset')}
          </button>
        </div>
      </div>
      <div className={styles.main}>
        <div
          className={styles.space}
          ref={spaceRef}
          aria-label={t('space')}
          role="region"
          data-testid="ec-space"
        >
          {!craft.chips.length && <div className={styles.empty}>{t('empty')}</div>}
          {craft.chips.map((k) => {
            const dragging = drag?.uid === k.uid && drag.moved;
            const style = dragging
              ? { left: drag.lx, top: drag.ly }
              : { left: `${k.x * 100}%`, top: `${k.y * 100}%` };
            return (
              <button
                type="button"
                key={k.uid}
                className={`${styles.chip} ${styles.onSpace} ${selected === k.uid ? styles.selected : ''} ${dragging ? styles.dragging : ''} ${popUid === k.uid ? styles.pop : ''}`}
                style={style}
                onPointerDown={(e) => startDrag(e, k.uid, k.id)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
                onDoubleClick={() => apply(duplicate(craftRef.current, k.uid))}
                onContextMenu={(e) => {
                  e.preventDefault();
                  apply(removeChip(craftRef.current, k.uid));
                }}
                onKeyDown={(e) => chipKey(e, k.uid)}
                aria-label={t('chip.help', { e: label(k.id) })}
                aria-pressed={selected === k.uid}
                data-testid={`ec-chip-${k.id}`}
              >
                <span className={styles.emoji}>{ELEMENTS[k.id]!.emoji}</span>
                {label(k.id)}
              </button>
            );
          })}
          {toast && (
            <div className={styles.toast} key={toast.key} role="status" data-testid="ec-toast">
              {toast.text}
            </div>
          )}
        </div>
        <div className={styles.side} ref={sideRef}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search', { n: craft.found.length })}
            aria-label={t('search', { n: craft.found.length })}
            data-testid="ec-search"
          />
          <div className={styles.sortRow}>
            <button
              type="button"
              className="btn btn-small"
              aria-pressed={sort === 'time'}
              onClick={() => setSort('time')}
            >
              {t('sort.time')}
            </button>
            <button
              type="button"
              className="btn btn-small"
              aria-pressed={sort === 'name'}
              onClick={() => setSort('name')}
            >
              {t('sort.name')}
            </button>
          </div>
          <div className={styles.list} role="list" aria-label={t('list')} data-testid="ec-list">
            {items.map((id) => (
              <button
                type="button"
                role="listitem"
                key={id}
                className={styles.chip}
                onPointerDown={(e) => startDrag(e, null, id)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => itemKey(e, id)}
                aria-label={t('item.help', { e: label(id) })}
                data-testid={`ec-item-${id}`}
              >
                <span className={styles.emoji}>{ELEMENTS[id]!.emoji}</span>
                {label(id)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {ghostFor && (
        <div
          className={`${styles.chip} ${styles.ghost}`}
          style={{ left: ghostFor.x, top: ghostFor.y }}
        >
          <span className={styles.emoji}>{ELEMENTS[ghostFor.id]!.emoji}</span>
          {label(ghostFor.id)}
        </div>
      )}
    </div>
  );
}
