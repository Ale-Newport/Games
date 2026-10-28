import type { Locale } from '../../core/i18n';
import { SlidingRules } from '../shared/sliding/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return <SlidingRules locale={locale} size={3} />;
}
