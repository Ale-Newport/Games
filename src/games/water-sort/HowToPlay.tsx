import type { Locale } from '../../core/i18n';
import { SortRules } from '../shared/sorting/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return <SortRules locale={locale} look="water" />;
}
