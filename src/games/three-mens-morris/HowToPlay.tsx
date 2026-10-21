import type { Locale } from '../../core/i18n';
import { MorrisRulesText } from '../shared/morris/HowToPlay';
import { VARIANT } from './rules';

export function Rules({ locale }: { locale: Locale }) {
  return <MorrisRulesText locale={locale} v={VARIANT} />;
}
