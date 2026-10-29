import type { Locale } from '../../core/i18n';
import { CubeRules } from '../shared/cube/HowToPlay';

export function Rules({ locale }: { locale: Locale }) {
  return <CubeRules locale={locale} size={3} solver="twophase" />;
}
