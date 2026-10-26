import type { Locale } from '../../core/i18n';
import { PokerRules } from '../shared/poker/HowToPlay';
import { VARIANT } from './rules';

export function Rules({ locale }: { locale: Locale }) {
  return <PokerRules locale={locale} variant={VARIANT} />;
}
