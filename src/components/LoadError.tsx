import { RotateCcw, WifiOff } from 'lucide-react';
import { useT } from '../app/platform';
import styles from './LoadError.module.css';

/** Shown in place of a game when its data could not be downloaded, with a working retry. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className={styles.panel} role="alert" data-testid="load-error">
      <WifiOff size={28} aria-hidden="true" />
      <p>{t('game.dataError')}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry} data-testid="load-retry">
        <RotateCcw size={16} /> {t('game.dataRetry')}
      </button>
    </div>
  );
}
