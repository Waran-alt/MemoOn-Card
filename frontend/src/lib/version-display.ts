/**
 * Keep footer label readable: never show a 40-character git sha.
 */
export function normalizeVersionLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^[0-9a-f]{40}$/i.test(t)) return t.slice(0, 7);
  const plusIdx = t.indexOf('+');
  if (plusIdx !== -1) {
    const suffix = t.slice(plusIdx + 1);
    if (/^[0-9a-f]{8,}$/i.test(suffix)) {
      return `${t.slice(0, plusIdx)}+${suffix.slice(0, 7)}`;
    }
  }
  return t;
}
