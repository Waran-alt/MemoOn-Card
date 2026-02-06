'use client';

import { getBestLocale, getPluralCategory, I18N_CONFIG, type SupportedNamespace } from 'i18n';
import { useEffect, useState } from 'react';

interface TranslationData {
  [key: string]: string | TranslationData;
}

export type InterpolationVariables = Record<string, string | number | boolean>;

export type TranslationOptions = {
  fallback?: string;
  vars?: InterpolationVariables;
  /**
   * When set, the plural form is chosen by locale using CLDR rules (e.g. key_one, key_other).
   * Count is also added to vars as {{count}}. Use flat keys only (no dots) for pluralization.
   */
  count?: number;
};

export type TranslationFunction = (key: string, options?: TranslationOptions) => string;

export function useTranslation(
  namespace: SupportedNamespace = 'common',
  locale: string = I18N_CONFIG.defaultLocale
) {
  const normalizedLocale = getBestLocale(locale);
  const [translations, setTranslations] = useState<TranslationData>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(`../../public/locales/${normalizedLocale}/${namespace}.json`);
        if (!cancelled) setTranslations(mod as unknown as TranslationData);
      } catch (err) {
        try {
          const fallbackMod = await import(
            `../../public/locales/${I18N_CONFIG.fallbackLocale}/${namespace}.json`
          );
          if (!cancelled) setTranslations(fallbackMod as unknown as TranslationData);
        } catch {
          if (!cancelled) setTranslations({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [normalizedLocale, namespace]);

  const t: TranslationFunction = (key, options) => {
    const fallback = options?.fallback;
    const count = options?.count;
    const vars: InterpolationVariables = { ...options?.vars };
    if (typeof count === 'number') vars.count = count;

    const keys = key.split('.');
    let value: string | TranslationData | undefined = translations;

    if (typeof count === 'number' && keys.length === 1) {
      const category = getPluralCategory(normalizedLocale, count);
      const pluralKey = `${key}_${category}`;
      const tryKeys = [pluralKey, `${key}_other`, key];
      for (const k of tryKeys) {
        const leaf = k.split('.');
        let v: string | TranslationData | undefined = translations;
        for (const part of leaf) {
          if (v && typeof v === 'object' && part in v) {
            v = (v as TranslationData)[part] as string | TranslationData | undefined;
          } else {
            v = undefined;
            break;
          }
        }
        if (typeof v === 'string') {
          value = v;
          break;
        }
      }
      if (typeof value !== 'string') value = fallback ?? key;
    } else {
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as TranslationData)[k] as string | TranslationData | undefined;
        } else {
          value = (fallback ?? key) as string;
          break;
        }
      }
      if (typeof value !== 'string') value = fallback ?? key;
    }

    let result = typeof value === 'string' ? value : (fallback ?? key);
    if (vars && typeof result === 'string') {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      });
    }
    return result;
  };

  return { t, locale: normalizedLocale, translations };
}
