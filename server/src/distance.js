const UA = "JayalakshmiCabs/1.0 (booking website)";

async function getJson(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    const error = new Error("The map service is unavailable. Please try again in a minute.");
    error.status = 503;
    throw error;
  }
  if (!response.ok) {
    const error = new Error("The map service could not calculate this route.");
    error.status = 502;
    throw error;
  }
  return response.json();
}

function chosenPoint(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 6 || lat > 37 || lng < 68 || lng > 98) return null;
  return { lat, lng };
}

export async function roadDistanceKm(pickup, drop, points = {}) {
  const find = async (q) => {
    const list = await getJson(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=1&q=" + encodeURIComponent(q)
    );
    if (!list[0]) throw new Error(`Could not find "${q}". Add the town name, for example "Dharmapuri bus stand, Tamil Nadu".`);
    return { lat: Number(list[0].lat), lng: Number(list[0].lon), label: list[0].display_name };
  };

  const pickedFrom = chosenPoint(points.pickup);
  const pickedTo = chosenPoint(points.drop);
  const from = pickedFrom ? { ...pickedFrom, label: pickup } : await find(pickup);
  const to = pickedTo ? { ...pickedTo, label: drop } : await find(drop);
  const route = await getJson(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`
  );
  const meters = route.routes?.[0]?.distance;
  if (!meters) throw new Error("No driving route was found between those places.");
  return { km: Math.max(1, Math.round(meters / 1000)), pickupLabel: from.label, dropLabel: to.label };
}
