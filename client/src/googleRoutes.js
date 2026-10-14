const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/** Driving distance (km) between two pins using Google Routes API — same family as the map UI. */
export async function googleDrivingKm(from, to) {
  if (!API_KEY) throw new Error("Google Maps API key is missing.");
  const lat1 = Number(from?.lat);
  const lng1 = Number(from?.lng);
  const lat2 = Number(to?.lat);
  const lng2 = Number(to?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) throw new Error("Both places need a map pin.");

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: lat1, longitude: lng1 } } },
      destination: { location: { latLng: { latitude: lat2, longitude: lng2 } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const msg = data.error?.message || "";
    if (response.status === 403 && /referer/i.test(msg)) {
      throw new Error("Google Routes API blocked this site. Add your domain (and localhost) to the API key HTTP referrers, and enable Routes API.");
    }
    throw new Error(msg || "Google could not measure this driving route.");
  }
  const meters = data.routes?.[0]?.distanceMeters;
  if (!Number.isFinite(meters)) throw new Error("Google returned no driving route for these pins.");
  return Math.max(1, Math.round(meters / 1000));
}
