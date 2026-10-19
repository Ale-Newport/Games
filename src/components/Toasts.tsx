import { Trophy } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { usePlatform } from '../app/platform';
import styles from './Toasts.module.css';

export function Toasts() {
  const { toasts } = usePlatform();
  const items = useSyncExternalStore(toasts.subscribe, toasts.get);
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {items.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={styles.toast}
          onClick={() => toasts.dismiss(toast.id)}
        >
          <span className={styles.icon} aria-hidden="true">
            <Trophy size={20} />
          </span>
          <span>
            <span className={styles.title}>{toast.title}</span>
            <span className={styles.body}>{toast.body}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
