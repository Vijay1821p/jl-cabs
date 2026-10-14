const KEY = "jc_search";

export function saveSearchDraft(draft) {
  const payload = JSON.stringify(draft);
  try { sessionStorage.setItem(KEY, payload); } catch { /* ignore */ }
  try { localStorage.setItem(KEY, payload); } catch { /* ignore */ }
}

export function readSearchDraft() {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
  }
  return {};
}

export function bookQueryFromDraft(draft) {
  const query = new URLSearchParams();
  if (draft.trip) query.set("trip", draft.trip);
  if (draft.vehicle) query.set("vehicle", draft.vehicle);
  if (draft.pickup) query.set("pickup", draft.pickup);
  if (draft.drop) {
    query.set("drop", draft.drop);
    query.set("drop_location", draft.drop);
  }
  for (const key of ["pickup_lat", "pickup_lng", "drop_lat", "drop_lng"]) {
    const value = Number(draft[key]);
    if (Number.isFinite(value)) query.set(key, String(value));
  }
  if (draft.date) query.set("date", draft.date);
  if (draft.time) query.set("time", draft.time);
  if (draft.trip === "round") query.set("days", String(draft.days || 1));
  if (draft.trip === "hourly") {
    query.set("package", draft.package_kind || "local");
    query.set("hours", String(draft.hours || 2));
  }
  return query;
}
