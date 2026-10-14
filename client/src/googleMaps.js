const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const CALLBACK = "__jcMapsReady";

let placesPromise;

export function loadGooglePlaces() {
  if (!API_KEY) {
    return Promise.reject(new Error("Set VITE_GOOGLE_MAPS_API_KEY in Vercel, then redeploy."));
  }
  if (window.google?.maps?.places?.AutocompleteSuggestion) {
    return Promise.resolve(window.google.maps.places);
  }
  if (placesPromise) return placesPromise;

  placesPromise = new Promise((resolve, reject) => {
    const finish = () => {
      const ready = window.google?.maps?.importLibrary;
      if (!ready) {
        reject(new Error("Google Maps Places did not load."));
        return;
      }
      window.google.maps.importLibrary("places").then((places) => {
        if (places?.AutocompleteSuggestion) resolve(places);
        else reject(new Error("Google Maps Places did not load."));
      }).catch((error) => {
        placesPromise = null;
        reject(error);
      });
    };

    const fail = () => {
      placesPromise = null;
      reject(new Error("Could not load Google Maps. Check the connection and API key."));
    };

    window[CALLBACK] = () => {
      delete window[CALLBACK];
      finish();
    };

    const existing = document.querySelector("script[data-google-maps='places']");
    if (existing) {
      if (window.google?.maps?.importLibrary) finish();
      else {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", fail, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "places";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&callback=${CALLBACK}&loading=async`;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return placesPromise;
}
