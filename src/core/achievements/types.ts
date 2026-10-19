import type { LocalizedText } from '../i18n';

export interface AchievementDef {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  /** Hidden until unlocked. */
  secret?: boolean;
}
