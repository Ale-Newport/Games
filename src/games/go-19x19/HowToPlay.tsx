import type { Locale } from '../../core/i18n';
import { GoRulesText } from '../shared/go/HowToPlay';
import { RULES } from './rules';

export function Rules({ locale }: { locale: Locale }) {
  return <GoRulesText locale={locale} size={RULES.size} komi={RULES.komi} />;
}
