import { popularRouteKmFromAddresses } from "@jc/shared";

const UA = "JayalakshmiCabs/1.0 (booking website)";

const PLACE_BOUNDS = [
  {
    test: /yercaud/i,
    latMin: 11.6,
    latMax: 11.95,
    lngMin: 78.05,
    lngMax: 78.35,
    search: "Yercaud, Salem, Tamil Nadu, India",
  },
];

async function getJson(url, init) {
  let response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, "Accept-Language": "en", ...(init?.headers || {}) },
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

function haversineKm(from, to) {
  const rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad;
  const dLng = (to.lng - from.lng) * rad;
  const lat = ((from.lat + to.lat) / 2) * rad;
  return Math.hypot(dLng * Math.cos(lat) * 6371, dLat * 6371);
}

function saneGoogleKm(km, from, to, points = {}) {
  const value = Number(km);
  if (!Number.isFinite(value) || value < 1) return false;
  const pinFrom = chosenPoint(points.pickup);
  const pinTo = chosenPoint(points.drop);
  const a = pinFrom || from;
  const b = pinTo || to;
  const straight = haversineKm(a, b);
  return value >= straight * 1.02 && value <= Math.max(straight * 3.5, straight + 400);
}

function nominatimQuery(label) {
  const text = String(label || "").trim();
  if (!text) return text;
  for (const place of PLACE_BOUNDS) {
    if (place.test.test(text)) return place.search;
  }
  return text;
}

function pinMatchesLabel(label, point) {
  const picked = chosenPoint(point);
  if (!picked) return false;
  const text = String(label || "");
  for (const place of PLACE_BOUNDS) {
    if (!place.test.test(text)) continue;
    return picked.lat >= place.latMin
      && picked.lat <= place.latMax
      && picked.lng >= place.lngMin
      && picked.lng <= place.lngMax;
  }
  return true;
}

function searchTokens(label) {
  return String(label || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 3);
}

function pickGeocodeResult(label, list) {
  if (!list?.length) return null;
  const tokens = searchTokens(label);
  if (!tokens.length) return list[0];
  let best = list[0];
  let bestScore = -1;
  for (const row of list) {
    const name = String(row.display_name || "").toLowerCase();
    const score = tokens.filter((token) => name.includes(token)).length;
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return best;
}

async function geocodePlace(label) {
  const query = nominatimQuery(label);
  const list = await getJson(
    "https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=5&q=" + encodeURIComponent(query),
  );
  const row = pickGeocodeResult(label, list);
  if (!row) {
    throw new Error(`Could not find "${label}". Add the town name, for example "Dharmapuri bus stand, Tamil Nadu".`);
  }
  return {
    lat: Number(row.lat),
    lng: Number(row.lon),
    label: row.display_name,
  };
}

async function resolvePlace(label, point) {
  const picked = chosenPoint(point);
  if (picked) {
    return {
      lat: picked.lat,
      lng: picked.lng,
      label: String(label || "").trim() || "Pinned location",
      fromPin: pinMatchesLabel(label, picked),
    };
  }
  return { ...(await geocodePlace(label)), fromPin: false };
}

async function osrmKm(from, to) {
  const route = await getJson(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`,
  );
  const meters = route.routes?.[0]?.distance;
  if (!meters) throw new Error("No driving route was found between those places.");
  return Math.max(1, Math.round(meters / 1000));
}

async function googleRoutesKm(from, to, apiKey) {
  const data = await getJson("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
      destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
    }),
  });
  const meters = data.routes?.[0]?.distanceMeters;
  if (!Number.isFinite(meters)) throw new Error("Google returned no driving route.");
  return Math.max(1, Math.round(meters / 1000));
}

export async function roadDistanceKm(pickup, drop, points = {}, options = {}) {
  const from = await resolvePlace(pickup, points.pickup);
  const to = await resolvePlace(drop, points.drop);
  const tariffKm = popularRouteKmFromAddresses(pickup, drop);

  let km = null;
  let source = "osrm";

  if (saneGoogleKm(options.googleKm, from, to, points)) {
    km = Math.round(Number(options.googleKm));
    source = "google";
  } else {
    const serverKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_ROUTES_API_KEY || "";
    if (serverKey) {
      try {
        km = await googleRoutesKm(from, to, serverKey);
        source = "google";
      } catch {
        km = null;
      }
    }
  }

  if (km == null) km = await osrmKm(from, to);
  if (source !== "google" && tariffKm && tariffKm > km) km = tariffKm;

  return {
    km,
    source,
    pickupLabel: from.label,
    dropLabel: to.label,
    pickupFromPin: from.fromPin,
    dropFromPin: to.fromPin,
  };
}
