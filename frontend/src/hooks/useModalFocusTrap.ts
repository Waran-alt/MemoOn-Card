'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function isFocusableElement(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
  const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  return true;
}

/** Tab-order focusables inside `root` (visible, not disabled). Exported for tests. */
export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter(isFocusableElement);
}

/**
 * When `open` is true, moves focus to the first focusable inside `containerRef` and
 * keeps Tab / Shift+Tab cycling within that container. Restores the previously focused
 * element on close.
 */
export function useModalFocusTrap(open: boolean, containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!open) return;

    const root = containerRef.current;
    if (!root) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let addedTabIndex = false;

    const applyInitialFocus = () => {
      const list = getFocusableElements(root);
      if (list.length > 0) {
        list[0].focus();
      } else {
        if (!root.hasAttribute('tabindex')) {
          root.setAttribute('tabindex', '-1');
          addedTabIndex = true;
        }
        root.focus();
      }
    };

    const raf = requestAnimationFrame(() => {
      applyInitialFocus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const currentRoot = containerRef.current;
      if (!currentRoot) return;

      const list = getFocusableElements(currentRoot);
      if (list.length === 0) {
        e.preventDefault();
        return;
      }

      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !currentRoot.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !currentRoot.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      if (addedTabIndex) {
        root.removeAttribute('tabindex');
      }
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [open, containerRef]);
}
