/** The six cowrie shells of a Pachisi throw: open mouths up count (none up is 25, one is 10). */
import styles from './Cowries.module.css';

export function Cowries({ faces, value }: { faces: boolean[] | null; value: number | null }) {
  return (
    <span className={styles.row} data-testid="pc-throw">
      {(faces ?? [false, false, false, false, false, false]).map((up, i) => (
        <svg
          key={i}
          viewBox="0 0 20 28"
          className={[styles.shell, faces ? '' : styles.idle].join(' ')}
        >
          <ellipse cx={10} cy={14} rx={9} ry={13} className={styles.back} />
          {up && <path d="M10 3 C7 9, 7 19, 10 25 C13 19, 13 9, 10 3 Z" className={styles.mouth} />}
        </svg>
      ))}
      <span className={styles.value}>{faces && value !== null ? value : ''}</span>
    </span>
  );
}
