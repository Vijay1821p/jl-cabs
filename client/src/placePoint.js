/** Keep map/search pins when the user only edits the address text slightly (e.g. door number). */
export function pointAfterAddressEdit(nextText, point) {
  if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) return null;
  const next = String(nextText || "").trim();
  const prev = String(point.address || "").trim();
  if (!next) return null;
  if (next === prev) return { ...point, address: next };
  const n = next.toLowerCase();
  const p = prev.toLowerCase();
  if (n.startsWith(p) || p.startsWith(n)) return { ...point, address: next };
  const words = (text) => text.split(/[^a-z0-9]+/i).filter((word) => word.length > 3);
  const prevWords = words(prev);
  if (!prevWords.length) return null;
  const matched = prevWords.filter((word) => n.includes(word)).length;
  if (matched / prevWords.length >= 0.55) return { ...point, address: next };
  return null;
}

export function hasExactPoint(point) {
  return Boolean(point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)));
}
