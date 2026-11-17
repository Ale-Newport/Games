/**
 * A country name box with an autocomplete list (both languages, aliases, accents ignored).
 * Arrow keys move through suggestions, Enter picks the highlighted one (or an exact name), a
 * click picks too. `exclude` hides countries already used.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { normalize } from '../survey/engine';
import styles from './CountryInput.module.css';
import { COUNTRIES, matchCountry, type Lang } from './world';

export function CountryInput({
  lang,
  onPick,
  exclude = [],
  pool,
  placeholder,
  disabled,
  buttonLabel,
  testId = 'ci',
}: {
  lang: Lang;
  onPick: (iso2: string) => void;
  exclude?: readonly string[];
  pool?: readonly string[];
  placeholder: string;
  disabled?: boolean;
  buttonLabel: string;
  testId?: string;
}) {
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const allowed = useMemo(
    () => COUNTRIES.filter((c) => !exclude.includes(c.iso2) && (!pool || pool.includes(c.iso2))),
    [exclude, pool],
  );
  const key = normalize(text);
  const list = useMemo(() => {
    if (!key) return [];
    const starts = allowed.filter((c) => c.keys[lang].some((k) => k.startsWith(key)));
    const contains = allowed.filter(
      (c) => !starts.includes(c) && c.keys[lang].some((k) => k.includes(key)),
    );
    return [...starts, ...contains]
      .sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang))
      .slice(0, 8);
  }, [allowed, key, lang]);

  const pick = (iso2: string) => {
    onPick(iso2);
    setText('');
    setActive(0);
  };

  const submit = () => {
    const exact = matchCountry(text, lang, allowed);
    if (exact) pick(exact.iso2);
    else if (list[active]) pick(list[active].iso2);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(list.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') setText('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <input
          className={`input ${styles.input}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={list.length > 0}
          aria-controls={`${testId}-list`}
          aria-label={placeholder}
          data-testid={`${testId}-input`}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={submit}
          disabled={disabled || !text.trim()}
          data-testid={`${testId}-go`}
        >
          {buttonLabel}
        </button>
      </div>
      {list.length > 0 && !disabled && (
        <ul
          className={styles.list}
          role="listbox"
          id={`${testId}-list`}
          data-testid={`${testId}-list`}
        >
          {list.map((c, i) => (
            <li
              key={c.iso2}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c.iso2);
              }}
              data-testid={`${testId}-option-${c.iso2}`}
            >
              {c.name[lang]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
