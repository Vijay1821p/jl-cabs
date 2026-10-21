/**
 * Meta Pixel events. The base pixel is loaded in index.html; these helpers do nothing if it is blocked,
 * and never track the Admin area.
 */
export function trackPixel(event, params, options) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    if (window.location.pathname.startsWith("/admin")) return;
    if (params && options) window.fbq("track", event, params, options);
    else if (params) window.fbq("track", event, params);
    else window.fbq("track", event);
  } catch {
    // Tracking must never break booking.
  }
}

/** Fire an event once per key (survives page refresh in this browser). */
export function trackPixelOnce(key, event, params, options) {
  try {
    const storageKey = `jc_px_${key}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "1");
  } catch {
    // If storage is unavailable, fall through and track once for this call.
  }
  trackPixel(event, params, options);
}
