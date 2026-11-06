import type { Locale } from '../../core/i18n';
import { HexRulesText } from '../shared/hex/HowToPlay';
import { SIZE } from './rules';

export function Rules({ locale }: { locale: Locale }) {
  return <HexRulesText locale={locale} size={SIZE} />;
}
