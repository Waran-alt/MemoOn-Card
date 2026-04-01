import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import type { Category } from '@/types';
import { EditCardCategoryPicker } from '../EditCardCategoryPicker';

const cat = (id: string, name: string): Category => ({
  id,
  user_id: 'u',
  name,
  created_at: '2025-01-01T00:00:00Z',
});

describe('EditCardCategoryPicker', () => {
  it('filters add list by search and toggles selection', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const cats = [cat('a', 'Alpha'), cat('b', 'Beta')];
    render(
      <EditCardCategoryPicker
        idPrefix="t"
        categories={cats}
        selectedIds={new Set()}
        onToggle={onToggle}
        sectionLabel="Categories"
        addSectionLabel="Add"
        searchPlaceholder="Search…"
        noMatchMessage="No match"
        noCategoriesMessage="None"
        noneSelectedHint="Pick below"
        getRemoveAriaLabel={(n) => `Remove ${n}`}
        getAddAriaLabel={(n) => `Add ${n}`}
      />
    );
    const search = screen.getByPlaceholderText('Search…');
    await user.type(search, 'et');
    expect(screen.queryByRole('button', { name: 'Add Alpha' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Beta' }));
    expect(onToggle).toHaveBeenCalledWith('b');
  });

  it('hides search and add list when every category is already selected', () => {
    const cats = [cat('a', 'Alpha')];
    render(
      <EditCardCategoryPicker
        idPrefix="t"
        categories={cats}
        selectedIds={new Set(['a'])}
        onToggle={vi.fn()}
        sectionLabel="Categories"
        addSectionLabel="Add"
        searchPlaceholder="Search…"
        noMatchMessage="No match"
        noCategoriesMessage="None"
        noneSelectedHint="Pick below"
        getRemoveAriaLabel={(n) => `Remove ${n}`}
        getAddAriaLabel={(n) => `Add ${n}`}
      />
    );
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();
  });
});
