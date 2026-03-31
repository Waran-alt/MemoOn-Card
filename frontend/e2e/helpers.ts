/**
 * Playwright helpers; strings via e2e/i18n.ts and public/locales (grid 4.7).
 */
import { expect, type Page } from '@playwright/test';
import { a, c } from './i18n';

/**
 * Authenticated app home: wait for `AppLayoutShell` to mark `data-e2e-shell-ready="1"` (post-hydration),
 * then the shell `h1` “My decks”. Reduces flakes when parallel workers or refresh race the first paint.
 */
export async function expectMyDecksHeading(page: Page, timeout = 20_000) {
  await expect(page.locator('html')).toHaveAttribute('data-e2e-shell-ready', '1', { timeout });
  await expect(page.getByRole('heading', { name: c('myDecks') })).toBeVisible({ timeout });
}

/**
 * Sidebar Sign out. Uses in-page `HTMLButtonElement.click()` so React’s `onClick` always runs;
 * Playwright pointer clicks (`force: true`) can fail to invoke handlers when dev overlays sit above
 * the sidebar or with certain event ordering. Logout then does `window.location.href = …/login`.
 */
export async function clickAppSignOut(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: c('signOut') });
  await btn.evaluate((el) => (el as HTMLButtonElement).click());
  await expect(page).toHaveURL(/\/login(?:$|[?#])/, { timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByLabel(new RegExp(`^${c('email')}$`, 'i'))).toBeVisible({ timeout: 20_000 });
}

/** Deck list tiles use `<h3>` for titles; `getByRole('heading', { name })` matches on `/app` without navigating. */
const DECK_DETAIL_PATH = /^\/[^/]+\/app\/decks\/[^/]+\/?$/;

export async function waitForDeckDetailPath(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForURL((url) => DECK_DETAIL_PATH.test(url.pathname), { timeout });
}

/**
 * Open deck study route. Programmatic `<a>.click()` does not reliably trigger Next.js App Router
 * client navigation in Playwright; same-origin `goto` matches real user navigation.
 */
export async function clickDeckStudyLink(page: Page): Promise<void> {
  let { origin, pathname } = new URL(page.url());
  if (/\/study\/?$/.test(pathname) || /\/study[?#]/.test(pathname)) {
    await expect(page).toHaveURL(/\/study(?:$|[?#])/, { timeout: 5_000 });
    return;
  }
  const appRootPath = /^\/[^/]+\/app\/?$/;
  if (appRootPath.test(pathname)) {
    await waitForDeckDetailPath(page);
    ({ origin, pathname } = new URL(page.url()));
  }
  const m = pathname.match(/^\/([^/]+)\/app\/decks\/([^/]+)\/?$/);
  if (!m) {
    throw new Error(`clickDeckStudyLink: expected /{locale}/app/decks/{id}, got ${pathname}`);
  }
  const [, locale, deckId] = m;
  await page.goto(`${origin}/${locale}/app/decks/${deckId}/study`);
  await expect(page).toHaveURL(/\/study(?:$|[?#])/, { timeout: 20_000 });
}

/** Study UI: question hidden until this, then answer (see study/page.tsx). */
export async function studyRevealQuestionAndAnswer(page: Page) {
  await page.getByRole('button', { name: a('showQuestion') }).click();
  await page.getByRole('button', { name: a('showAnswer') }).click();
}
