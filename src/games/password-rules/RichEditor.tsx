/**
 * A rich-text password field: each character keeps its own bold, italic, font and size. The DOM is
 * owned by the browser while typing; the model is parsed back on every input and the DOM is only
 * rebuilt when the model changes from outside (formatting, fire, Paul…), keeping the caret.
 */
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { charOf, DEFAULT_SIZE, FONTS, graphemes, type Font, type PChar } from './rules';
import styles from './Password.module.css';

export const FAMILY: Record<Font, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "Courier New", monospace',
  cursive: '"Comic Neue", "Segoe Print", "Bradley Hand", cursive',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sameStyle = (a: PChar, b: PChar) => a.b === b.b && a.i === b.i && a.f === b.f && a.s === b.s;

export function toHtml(chars: PChar[]): string {
  let html = '';
  for (let k = 0; k < chars.length;) {
    const c = chars[k]!;
    let text = '';
    while (k < chars.length && sameStyle(chars[k]!, c)) text += chars[k++]!.c;
    html += `<span data-b="${c.b ? 1 : 0}" data-i="${c.i ? 1 : 0}" data-f="${c.f}" data-s="${c.s}" style="font-weight:${c.b ? 700 : 400};font-style:${c.i ? 'italic' : 'normal'};font-family:${FAMILY[c.f]};font-size:${c.s}px">${esc(text)}</span>`;
  }
  return html;
}

export function parse(el: HTMLElement): PChar[] {
  const out: PChar[] = [];
  const walk = (node: Node, style: Omit<PChar, 'c'>) => {
    if (node.nodeType === 3) {
      for (const g of graphemes((node as Text).data))
        if (g !== '\n' && g !== '\r') out.push({ c: g, ...style });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    let s = style;
    const d = node.dataset;
    if (d.s !== undefined)
      s = {
        b: d.b === '1',
        i: d.i === '1',
        f: FONTS.includes(d.f as Font) ? (d.f as Font) : 'sans',
        s: Number(d.s) || DEFAULT_SIZE,
      };
    if (node.tagName === 'B' || node.tagName === 'STRONG') s = { ...s, b: true };
    if (node.tagName === 'I' || node.tagName === 'EM') s = { ...s, i: true };
    node.childNodes.forEach((n) => walk(n, s));
  };
  const base = charOf('');
  el.childNodes.forEach((n) => walk(n, { b: base.b, i: base.i, f: base.f, s: base.s }));
  return out;
}

export function getOffsets(el: HTMLElement): { start: number; end: number } | null {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  if (!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = graphemes(pre.toString()).length;
  pre.setEnd(range.endContainer, range.endOffset);
  const end = graphemes(pre.toString()).length;
  return { start, end };
}

function locate(el: HTMLElement, k: number): [Node, number] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let last: Text | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const g = graphemes(n.data);
    if (acc + g.length >= k) return [n, g.slice(0, k - acc).join('').length];
    acc += g.length;
    last = n;
  }
  return last ? [last, last.data.length] : [el, el.childNodes.length];
}

export function setOffsets(el: HTMLElement, start: number, end: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  const [sn, so] = locate(el, start);
  const [en, eo] = locate(el, end);
  range.setStart(sn, so);
  range.setEnd(en, eo);
  sel.removeAllRanges();
  sel.addRange(range);
}

export interface EditorApi {
  /** Restyle the selected characters (or, with nothing selected, nothing). */
  format(f: (c: PChar, all: PChar[]) => PChar): void;
  /** Insert text at the caret (or replace the selection). */
  insert(text: string): void;
  focus(): void;
}

export function RichEditor({
  chars,
  onChange,
  disabled,
  label,
  apiRef,
}: {
  chars: PChar[];
  onChange: (chars: PChar[]) => void;
  disabled: boolean;
  label: string;
  apiRef: Ref<EditorApi>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shown = useRef('');
  const saved = useRef<{ start: number; end: number } | null>(null);
  const charsRef = useRef(chars);
  useEffect(() => {
    charsRef.current = chars;
  }, [chars]);

  // Rebuild the DOM when the model changed from outside.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = JSON.stringify(chars);
    if (key === shown.current) return;
    const had = document.activeElement === el ? getOffsets(el) : null;
    el.innerHTML = toHtml(chars);
    shown.current = key;
    if (had) setOffsets(el, Math.min(had.start, chars.length), Math.min(had.end, chars.length));
  }, [chars]);

  // Remember the last selection inside the field (toolbar controls take the focus away).
  useEffect(() => {
    const onSel = () => {
      const el = ref.current;
      if (!el) return;
      const o = getOffsets(el);
      if (o) saved.current = o;
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  const commit = (next: PChar[], caret?: number) => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = toHtml(next);
    shown.current = JSON.stringify(next);
    if (caret !== undefined) {
      el.focus();
      setOffsets(el, caret, caret);
      saved.current = { start: caret, end: caret };
    }
    onChange(next);
  };

  const insertAt = (text: string) => {
    const cur = charsRef.current;
    const sel = saved.current ?? { start: cur.length, end: cur.length };
    const start = Math.min(sel.start, cur.length);
    const end = Math.min(Math.max(sel.end, start), cur.length);
    const style = cur[start - 1] ?? cur[end] ?? charOf('');
    const added = graphemes(text.replace(/[\r\n]+/g, ' ')).map((c) => ({ ...style, c }));
    commit([...cur.slice(0, start), ...added, ...cur.slice(end)], start + added.length);
  };

  useImperativeHandle(apiRef, () => ({
    format(f) {
      const cur = charsRef.current;
      const sel = saved.current;
      if (!sel || sel.start === sel.end) return;
      const picked = cur.slice(sel.start, sel.end);
      const next = cur.map((c, k) => (k >= sel.start && k < sel.end ? f(c, picked) : c));
      commit(next);
      const el = ref.current;
      if (el) {
        el.focus();
        setOffsets(el, sel.start, sel.end);
      }
    },
    insert: insertAt,
    focus: () => ref.current?.focus(),
  }));

  return (
    <div
      ref={ref}
      className={styles.editor}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      aria-multiline="false"
      spellCheck={false}
      data-testid="pw-input"
      onInput={(e) => {
        const next = parse(e.currentTarget);
        shown.current = JSON.stringify(next);
        const o = getOffsets(e.currentTarget);
        if (o) saved.current = o;
        onChange(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
        const mod = e.ctrlKey || e.metaKey;
        if (mod && (e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I')) {
          e.preventDefault();
          const o = getOffsets(e.currentTarget);
          if (o) saved.current = o;
          const key = e.key.toLowerCase() === 'b' ? 'b' : 'i';
          const cur = charsRef.current;
          const sel = saved.current;
          if (!sel || sel.start === sel.end) return;
          const all = cur.slice(sel.start, sel.end).every((c) => c[key]);
          commit(cur.map((c, k) => (k >= sel.start && k < sel.end ? { ...c, [key]: !all } : c)));
          setOffsets(e.currentTarget, sel.start, sel.end);
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const o = getOffsets(e.currentTarget);
        if (o) saved.current = o;
        insertAt(e.clipboardData.getData('text/plain'));
      }}
      onDrop={(e) => e.preventDefault()}
    />
  );
}
