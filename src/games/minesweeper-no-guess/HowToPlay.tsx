import type { Locale } from '../../core/i18n';
import { MinesRules } from '../shared/minesweeper/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return <MinesRules locale={locale} noGuess />;
}
