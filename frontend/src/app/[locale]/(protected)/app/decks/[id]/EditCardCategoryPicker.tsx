'use client';

import { useMemo, useState } from 'react';
import type { Category } from '@/types';
import { categoryBadgePillEditableShellClassName } from './CategoryBadgePill';
import { IconXMark } from './DeckUiIcons';

export type EditCardCategoryPickerProps = {
  idPrefix: string;
  categories: Category[];
  selectedIds: Set<string>;
  onToggle: (categoryId: string) => void;
  sectionLabel: string;
  addSectionLabel: string;
  searchPlaceholder: string;
  noMatchMessage: string;
  noCategoriesMessage: string;
  noneSelectedHint: string;
  getRemoveAriaLabel: (categoryName: string) => string;
  getAddAriaLabel: (categoryName: string) => string;
};

export function EditCardCategoryPicker({
  idPrefix,
  categories,
  selectedIds,
  onToggle,
  sectionLabel,
  addSectionLabel,
  searchPlaceholder,
  noMatchMessage,
  noCategoriesMessage,
  noneSelectedHint,
  getRemoveAriaLabel,
  getAddAriaLabel,
}: EditCardCategoryPickerProps) {
  const [query, setQuery] = useState('');

  const selectedOrdered = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return [...selectedIds].map((id) => byId.get(id)).filter(Boolean) as Category[];
  }, [categories, selectedIds]);

  const addableCount = useMemo(
    () => categories.filter((c) => !selectedIds.has(c.id)).length,
    [categories, selectedIds]
  );

  const addableFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => q === '' || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, selectedIds, query]);

  const searchInputId = `${idPrefix}-category-search`;
  const addListId = `${idPrefix}-category-add-list`;

  if (categories.length === 0) {
    return (
      <div className="mt-3">
        <p className="mb-2 text-sm font-medium text-(--mc-text-primary)">{sectionLabel}</p>
        <p className="text-sm text-(--mc-text-secondary)">{noCategoriesMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium text-(--mc-text-primary)">{sectionLabel}</p>
      <div className="mb-2 flex min-h-8 flex-wrap gap-1.5">
        {selectedOrdered.length === 0 ? (
          <span className="self-center text-sm text-(--mc-text-secondary)">{noneSelectedHint}</span>
        ) : (
          selectedOrdered.map((cat) => (
            <span key={cat.id} className={categoryBadgePillEditableShellClassName}>
              <span className="truncate">{cat.name}</span>
              <button
                type="button"
                onClick={() => onToggle(cat.id)}
                className="shrink-0 rounded-full my-auto mx-0.25 p-0.5 text-(--mc-text-muted) transition-colors hover:bg-(--mc-bg-surface) hover:text-(--mc-text-primary)"
                aria-label={getRemoveAriaLabel(cat.name)}
              >
                <IconXMark className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
      {addableCount > 0 && (
        <>
          <p className="mb-1 text-xs font-medium text-(--mc-text-secondary)">{addSectionLabel}</p>
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            aria-controls={addListId}
            className="w-full rounded-lg border border-(--mc-border-subtle) bg-(--mc-bg-surface) px-3 py-2 text-sm text-(--mc-text-primary) transition-[border-color,box-shadow] placeholder:text-(--mc-text-muted) focus:border-(--mc-accent-primary) focus:outline-none focus:shadow-[0_0_0_3px_rgb(99_102_241/0.2)]"
          />
          <ul
            id={addListId}
            className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-(--mc-border-subtle) bg-(--mc-bg-page) p-1"
            aria-label={addSectionLabel}
          >
            {addableFiltered.length > 0 ? (
              addableFiltered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-sm text-(--mc-text-primary) transition-colors hover:bg-(--mc-bg-card-back)"
                    onClick={() => {
                      onToggle(c.id);
                      setQuery('');
                    }}
                    aria-label={getAddAriaLabel(c.name)}
                  >
                    <span aria-hidden="true">{c.name}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-2 py-2 text-sm text-(--mc-text-secondary)">{noMatchMessage}</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
