import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { HomeContent } from '../HomeContent';

const localeState = vi.hoisted(() => ({ value: 'en' }));

vi.mock('i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('i18n')>();
  return {
    ...actual,
    useLocale: () => ({ locale: localeState.value }),
  };
});

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: (ns: string) => ({
    t: (key: string) =>
      (ns === 'common'
        ? { appName: 'MemoOn Card', createAccount: 'Create account', signIn: 'Sign in' }[key]
        : { tagline: 'Intelligent flashcard system with FSRS.' }[key]) ?? key,
  }),
}));

describe('HomeContent', () => {
  beforeEach(() => {
    localeState.value = 'en';
  });

  it('renders app name, tagline, and auth CTAs with locale-prefixed links', () => {
    render(<HomeContent />);
    expect(screen.getByRole('heading', { name: 'MemoOn Card' })).toBeInTheDocument();
    expect(screen.getByText(/Intelligent flashcard system/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/en/register');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/en/login');
  });

  it('uses current locale for link hrefs', () => {
    localeState.value = 'fr';
    render(<HomeContent />);
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/fr/register');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/fr/login');
  });
});
