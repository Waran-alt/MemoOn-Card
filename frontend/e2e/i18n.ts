/**
 * E2E copy from English locale JSON (same as UI on /en/… routes).
 */
import commonEn from '../public/locales/en/common.json';
import appEn from '../public/locales/en/app.json';

type CommonKey = keyof typeof commonEn;
type AppKey = keyof typeof appEn;

export function c(key: CommonKey): string {
  return commonEn[key];
}

export function a(key: AppKey): string {
  return appEn[key];
}

export function reviewedCountLine(count: number): string {
  const tpl = count === 1 ? appEn.reviewedCount_one : appEn.reviewedCount_other;
  return tpl.replace(/\{\{count\}\}/g, String(count));
}

export const E2E_LOCALE_PREFIX = '/en';
