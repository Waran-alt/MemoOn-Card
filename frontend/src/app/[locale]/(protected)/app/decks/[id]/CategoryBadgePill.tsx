import type { ReactNode } from 'react';

/** Read-only chip: deck list rows, linked-card preview, placeholders. */
export const categoryBadgePillReadonlyClassName =
  'inline-flex max-w-full items-center truncate rounded-full border border-(--mc-border-subtle) bg-(--mc-bg-card-back) px-2.5 pb-0.5 pt-0.5 text-xs text-(--mc-text-secondary)';

/** Shell for editable picker rows (label + remove control). */
export const categoryBadgePillEditableShellClassName =
  'inline-flex max-w-full items-center gap-1 rounded-full border border-(--mc-border-subtle) bg-(--mc-bg-card-back) pb-0.5 pl-2.5 pr-1 text-sm text-(--mc-text-primary)';

export type CategoryBadgePillProps = {
  children: ReactNode;
  className?: string;
};

export function CategoryBadgePill({ children, className }: CategoryBadgePillProps) {
  const extra = className?.trim();
  return (
    <span className={extra ? `${categoryBadgePillReadonlyClassName} ${extra}` : categoryBadgePillReadonlyClassName}>
      {children}
    </span>
  );
}
