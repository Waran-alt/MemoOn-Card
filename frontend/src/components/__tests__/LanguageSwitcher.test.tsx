import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { LanguageSwitcher } from '../LanguageSwitcher';

const pathnameState = vi.hoisted(() => ({ value: '/en/app/decks' }));
const localeState = vi.hoisted(() => ({ value: 'en' }));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    usePathname: () => pathnameState.value,
  };
});

vi.mock('i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('i18n')>();
  return {
    ...actual,
    useLocale: () => ({ locale: localeState.value }),
    removeLocalePrefix: (path: string) => path.replace(/^\/(en|fr|es)(?=\/|$)/, ''),
    LANGUAGES: [
      { code: 'en', nativeName: 'English', flag: 'EN' },
      { code: 'fr', nativeName: 'Francais', flag: 'FR' },
    ],
  };
});

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    pathnameState.value = '/en/app/decks';
    localeState.value = 'en';
  });

  it('renders language links with localized hrefs', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('navigation', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'EN English' })).toHaveAttribute('href', '/en/app/decks');
    expect(screen.getByRole('link', { name: 'FR Francais' })).toHaveAttribute('href', '/fr/app/decks');
  });

  it('marks current locale link as active', () => {
    localeState.value = 'fr';
    render(<LanguageSwitcher />);
    expect(screen.getByRole('link', { name: 'FR Francais' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'EN English' })).not.toHaveAttribute('aria-current');
  });
});
