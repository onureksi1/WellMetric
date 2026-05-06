import { useTranslation } from 'react-i18next';

/**
 * Standard i18n hook for the WellMetric project.
 * Uses the specified namespace as the primary and 'common' as the fallback.
 * 
 * @param namespace - The translation namespace (e.g., 'consultant', 'dashboard', 'admin')
 * @returns { t, tc, i18n } - t for primary namespace, tc for common namespace
 */
export const useT = (namespace: string) => {
  const { t, i18n } = useTranslation([namespace, 'common']);

  const typedT = (key: string, options?: any): string => t(key, options) as string;

  /**
   * Helper for common namespace keys.
   * Usage: tc('save'), tc('cancel')
   */
  const tc = (key: string, options?: any): string => t(`common.${key}`, options) as string;

  return { t: typedT, tc, i18n };
};
