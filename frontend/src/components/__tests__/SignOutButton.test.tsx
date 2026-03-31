import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { SignOutButton } from '../SignOutButton';

const mockLogout = vi.fn();
const mockPost = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { logout: () => void }) => void) => selector({ logout: mockLogout }),
}));
vi.mock('@/lib/api', () => ({ default: { post: mockPost } }));
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'signOut' ? 'Sign out' : key),
  }),
}));

describe('SignOutButton', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: 'http://localhost/en/app' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('renders "Sign out" text', () => {
    render(<SignOutButton />);
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls logout API with timeout, logout(), then sets window.location to login', async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockPost).toHaveBeenCalledWith('/api/auth/logout', {}, { timeout: 12_000 });
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(window.location.href).toBe('/en/login');
  });

  it('applies custom className when provided', () => {
    render(<SignOutButton className="custom-class" />);
    const btn = screen.getByRole('button', { name: /sign out/i });
    expect(btn).toHaveClass('custom-class');
  });

  it('still calls logout and redirects when logout API fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockPost).toHaveBeenCalledWith('/api/auth/logout', {}, { timeout: 12_000 });
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(window.location.href).toBe('/en/login');
  });
});
