import { useEffect, useRef, useState } from "react";
import { loadGooglePlaces } from "../googleMaps.js";
import {
  appendDistrictFromName,
  districtLabel,
  finalizeAddress,
  parseDistrictFromAddress,
  pointWithDistrict,
} from "../placeAddress.js";

const START = { lat: 11.0, lng: 77.2 };
const PRECISE_METRES = 200;

function positionFix(position) {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 5000,
  };
}

function isWard(value) {
  return /^ward\b/i.test(String(value || "").trim());
}

function placeLabel(address = {}) {
  const street = [address.house_number, address.road].filter(Boolean).join(" ");
  const areas = [
    address.neighbourhood,
    address.quarter,
    address.residential,
    address.suburb,
    address.city_district,
    address.village,
    address.hamlet,
  ];
  const city = address.city || address.town || address.municipality;
  const district = districtLabel(address.state_district || address.county);
  const parts = [];
  for (const part of [street, ...areas, city, district, address.state, address.postcode]) {
    if (!part || isWard(part)) continue;
    if (parts.some((item) => item.toLowerCase() === part.toLowerCase())) continue;
    parts.push(part);
  }
  return parts.join(", ");
}

function componentText(component) {
  return component?.longText || component?.long_name || "";
}

function componentValue(components, type) {
  return componentText((components || []).find((component) => component.types?.includes(type)));
}

function metresBetween(from, to) {
  const rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad;
  const dLng = (to.lng - from.lng) * rad;
  const lat = ((from.lat + to.lat) / 2) * rad;
  return Math.hypot(dLng * Math.cos(lat) * 6371000, dLat * 6371000);
}

function isJunk(part) {
  const text = String(part || "").trim();
  if (!text || isWard(text)) return true;
  if (/^[A-Z0-9]{4,}\+[A-Z0-9]+$/i.test(text)) return true;
  if (/^\d{6}$/.test(text)) return false;
  return /^[A-Z0-9]{3,12}$/.test(text);
}

function doorText(components) {
  const streetNumber = componentValue(components, "street_number");
  if (streetNumber && !isJunk(streetNumber)) return streetNumber;
  const premise = componentValue(components, "premise");
  if (premise && /\d/.test(premise) && !isJunk(premise)) return premise;
  return "";
}

function labelFromNearby(origin, found) {
  const rows = (found || []).map((place) => {
    const lat = place.location?.lat?.();
    const lng = place.location?.lng?.();
    return {
      metres: Number.isFinite(lat) && Number.isFinite(lng) ? metresBetween(origin, { lat, lng }) : 9999,
      components: place.addressComponents || [],
    };
  }).sort((a, b) => a.metres - b.metres);
  const nearest = rows[0];
  if (!nearest) return "";
  const door = nearest.metres <= 20 ? doorText(nearest.components) : "";
  const road = nearest.metres <= 50 ? componentValue(nearest.components, "route") : "";
  const areas = ["neighborhood", "sublocality_level_3", "sublocality_level_2", "sublocality_level_1"]
    .map((type) => componentValue(nearest.components, type));
  const city = componentValue(nearest.components, "locality");
  const district = districtLabel(rows.map((row) => componentValue(row.components, "administrative_area_level_2")).find(Boolean));
  const state = componentValue(nearest.components, "administrative_area_level_1");
  const postcode = componentValue(nearest.components, "postal_code");
  const street = [door, road].filter(Boolean).join(" ");
  const parts = [];
  for (const part of [street, ...areas, city, district, state, postcode]) {
    if (isJunk(part)) continue;
    if (parts.some((item) => item.toLowerCase() === part.toLowerCase())) continue;
    parts.push(part);
  }
  return finalizeAddress(parts.join(", "), ...rows.map((row) => row.components));
}

async function nearbyAddress(lat, lng) {
  const places = await loadGooglePlaces();
  if (!places.Place?.searchNearby) return "";
  const { places: found } = await places.Place.searchNearby({
    fields: ["formattedAddress", "location", "addressComponents"],
    locationRestriction: { center: { lat, lng }, radius: 120 },
    maxResultCount: 8,
    rankPreference: places.SearchNearbyRankPreference?.DISTANCE,
  });
  const componentSets = (found || []).map((place) => place.addressComponents || []);
  let label = labelFromNearby({ lat, lng }, found);
  label = finalizeAddress(label, ...componentSets);
  if (!parseDistrictFromAddress(label)) {
    for (const place of found || []) {
      label = finalizeAddress(label, place.addressComponents || []);
      if (parseDistrictFromAddress(label)) break;
    }
  }
  return label;
}

async function nominatimDistrict(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=10&lat=${lat}&lon=${lng}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const name = data.address?.state_district || data.address?.county || "";
    const state = data.address?.state || "";
    if (!name) return null;
    return { name, state };
  } finally {
    clearTimeout(timer);
  }
}

function yourLocationButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-my-location";
  button.title = "Your location";
  button.setAttribute("aria-label", "Your location");
  button.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <circle cx="12" cy="12" r="3.25" fill="none" stroke="currentColor" stroke-width="2"></circle>
    <circle cx="12" cy="12" r="1.15" fill="currentColor"></circle>
    <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
  </svg>`;
  return button;
}

async function placeName(lat, lng) {
  try {
    let googleLabel = await nearbyAddress(lat, lng);
    if (googleLabel && !parseDistrictFromAddress(googleLabel)) {
      const district = await nominatimDistrict(lat, lng);
      if (district) googleLabel = appendDistrictFromName(googleLabel, district.name, district.state);
    }
    if (googleLabel) return googleLabel;
  } catch {
    /* The area lookup can fail. The map name below is the backup. */
  }
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error("Could not name that point.");
    const data = await response.json();
    const label = placeLabel(data.address) || "";
    if (label && !parseDistrictFromAddress(label)) {
      return appendDistrictFromName(label, data.address?.state_district || data.address?.county, data.address?.state);
    }
    return label;
  } finally {
    clearTimeout(timer);
  }
}

export default function MapPick({ open, mode, onPick, onClose }) {
  const box = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pickRef = useRef(onPick);
  const closeRef = useRef(onClose);
  const modeRef = useRef(mode);
  const youRef = useRef(null);
  const accuracyRef = useRef(null);
  const hereRef = useRef(null);
  const watchRef = useRef(null);
  const settleRef = useRef(null);
  const locateBtnRef = useRef(null);
  const selectRef = useRef(() => {});
  const selectPlaceRef = useRef(() => {});
  const locateRef = useRef(() => {});
  const locateRun = useRef(0);
  const pinToken = useRef(0);
  const sessionRef = useRef(null);
  const requestRef = useRef(0);
  const searchTimer = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [hint, setHint] = useState("Search a place, press Your location, or tap the map.");
  const [error, setError] = useState("");
  const [here, setHere] = useState(null);
  pickRef.current = onPick;
  closeRef.current = onClose;
  modeRef.current = mode;

  function stopWatch() {
    if (watchRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    clearTimeout(settleRef.current);
    settleRef.current = null;
    locateBtnRef.current?.setAttribute("aria-busy", "false");
  }

  function fieldForMode() {
    return modeRef.current === "drop" ? "drop_location" : "pickup";
  }

  function pinExact(lat, lng, address, field = fieldForMode(), token = pinToken.current, point = null) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (token !== pinToken.current || !map || !marker || !window.google?.maps || !address) return;
    const position = new window.google.maps.LatLng(lat, lng);
    marker.setPosition(position);
    marker.setVisible(true);
    map.panTo(position);
    map.setZoom(16);
    pickRef.current(field, address, point || { address, lat, lng });
    setHint("Place pinned.");
    closeRef.current();
  }

  function selectAt(lat, lng) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !window.google?.maps) return;
    const token = ++pinToken.current;
    const field = fieldForMode();
    const position = new window.google.maps.LatLng(lat, lng);
    marker.setPosition(position);
    marker.setVisible(true);
    map.panTo(position);
    map.setZoom(Math.max(map.getZoom() || 0, 16));
    setHint("Finding the place name…");
    setError("");
    const finish = (address) => {
      if (token !== pinToken.current) return;
      if (!address) {
        setHint("Could not name that point. Tap again.");
        return;
      }
      const district = parseDistrictFromAddress(address);
      pinExact(lat, lng, address, field, token, { address, lat, lng, ...(district ? { district } : {}) });
    };
    placeName(lat, lng).then(finish).catch(() => finish(""));
  }

  async function selectPlace(placeId, lat, lng) {
    const token = ++pinToken.current;
    const field = fieldForMode();
    setHint("Pinning that place…");
    setError("");
    try {
      const places = await loadGooglePlaces();
      if (token !== pinToken.current) return;
      const place = new places.Place({ id: placeId });
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location", "addressComponents"] });
      if (token !== pinToken.current) return;
      const placeLat = place.location?.lat?.();
      const placeLng = place.location?.lng?.();
      const point = pointWithDistrict(
        place.formattedAddress || place.displayName || "",
        placeLat,
        placeLng,
        place.addressComponents,
      );
      if (!point.address || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) throw new Error("That place has no exact point.");
      pinExact(placeLat, placeLng, point.address, field, token, point);
    } catch {
      if (token !== pinToken.current) return;
      selectAt(lat, lng);
    }
  }

  function showHere(fix) {
    const map = mapRef.current;
    const you = youRef.current;
    const circle = accuracyRef.current;
    if (!map || !you || !circle || !window.google?.maps) return;
    const position = new window.google.maps.LatLng(fix.lat, fix.lng);
    you.setPosition(position);
    you.setVisible(true);
    circle.setCenter(position);
    const accurate = (fix.accuracy || 99999) <= PRECISE_METRES;
    circle.setRadius(Math.max(fix.accuracy || 40, 20));
    circle.setVisible(accurate || (fix.accuracy || 99999) <= 400);
    map.panTo(position);
    map.setZoom(accurate ? 17 : 15);
    const previous = hereRef.current;
    hereRef.current = fix;
    locateBtnRef.current?.classList.add("is-on");
    const moved = !previous
      || Math.abs(previous.lat - fix.lat) > 0.00004
      || Math.abs(previous.lng - fix.lng) > 0.00004
      || Math.abs((previous.accuracy || 0) - (fix.accuracy || 0)) > 20;
    if (moved) setHere(fix);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("This browser cannot read your location. Tap the map instead.");
      return;
    }
    const runId = ++locateRun.current;
    stopWatch();
    hereRef.current = null;
    setHere(null);
    setError("");
    setHint("Finding your location…");
    locateBtnRef.current?.setAttribute("aria-busy", "true");
    let settled = false;

    const onFix = (fix) => {
      if (runId !== locateRun.current || settled) return;
      const previous = hereRef.current;
      if (previous && fix.accuracy > previous.accuracy + 25) return;
      showHere(fix);
      locateBtnRef.current?.setAttribute("aria-busy", "false");
      if (fix.accuracy > 1500) {
        setHint("Your device location is on the map. Tap the exact place if the dot is off.");
        return;
      }
      settled = true;
      stopWatch();
      selectRef.current(fix.lat, fix.lng);
    };

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => onFix(positionFix(position)),
      (geoError) => {
        if (runId !== locateRun.current || settled || geoError.code !== 1) return;
        settled = true;
        stopWatch();
        setHint("Tap the map to choose the place.");
        setError("Location permission is blocked. Allow it in the browser, then press Your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    navigator.geolocation.getCurrentPosition(
      (position) => onFix(positionFix(position)),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
    );

    settleRef.current = setTimeout(() => {
      if (runId !== locateRun.current || settled) return;
      settled = true;
      stopWatch();
      if (hereRef.current) {
        setHint("Your device location is on the map. Tap the exact place if the dot is off.");
        return;
      }
      setHint("Tap the map to choose the place.");
      setError("Location did not arrive. Allow it in the browser, or tap the map.");
    }, 8000);
  }

  selectRef.current = selectAt;
  selectPlaceRef.current = selectPlace;
  locateRef.current = useCurrentLocation;

  function searchPlaces(text) {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const requestId = ++requestRef.current;
    loadGooglePlaces()
      .then(async (places) => {
        if (requestId !== requestRef.current) return;
        if (!sessionRef.current) sessionRef.current = new places.AutocompleteSessionToken();
        const { suggestions: next } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          includedRegionCodes: ["in"],
          sessionToken: sessionRef.current,
        });
        if (requestId !== requestRef.current) return;
        setSuggestions(next || []);
      })
      .catch((searchError) => {
        if (requestId !== requestRef.current) return;
        setSuggestions([]);
        setError(searchError.message || "Place search is unavailable.");
      });
  }

  function onSearch(event) {
    const next = event.target.value;
    setQuery(next);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchPlaces(next), 250);
  }

  async function chooseSuggestion(suggestion) {
    const prediction = suggestion?.placePrediction;
    if (!prediction) return;
    const token = ++pinToken.current;
    const field = fieldForMode();
    setSuggestions([]);
    setError("");
    setHint("Pinning that place…");
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location", "addressComponents"] });
      sessionRef.current = null;
      if (token !== pinToken.current) return;
      const lat = place.location?.lat?.();
      const lng = place.location?.lng?.();
      const point = pointWithDistrict(
        place.formattedAddress || place.displayName || String(prediction.text || ""),
        lat,
        lng,
        place.addressComponents,
      );
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("That place has no exact point.");
      pinExact(lat, lng, point.address, field, token, point);
    } catch (chooseError) {
      if (token !== pinToken.current) return;
      setHint("Search a place, press Your location, or tap the map.");
      setError(chooseError.message || "Could not pin that place.");
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    let listener;
    let resizeTimer;
    setError("");
    setHere(null);
    hereRef.current = null;
    setQuery("");
    setSuggestions([]);
    setHint(mode === "drop"
      ? "Search the drop, press Your location, or tap the map. This pin is used for the kilometres."
      : "Search the pickup, press Your location, or tap the map. This pin is used for the kilometres.");

    loadGooglePlaces()
      .then(() => {
        if (cancelled || !box.current || !window.google?.maps?.Map) return;
        const maps = window.google.maps;
        const map = new maps.Map(box.current, {
          center: START,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: true,
          zoomControl: true,
          zoomControlOptions: { position: maps.ControlPosition.RIGHT_CENTER },
        });
        const marker = new maps.Marker({
          map,
          visible: false,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: mode === "pickup" ? "#3b784a" : "#c0392b",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        const you = new maps.Marker({
          map,
          visible: false,
          clickable: true,
          zIndex: 5,
          title: "Your location",
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#1a73e8",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
        const circle = new maps.Circle({
          map,
          visible: false,
          strokeColor: "#1a73e8",
          strokeOpacity: 0.45,
          strokeWeight: 1,
          fillColor: "#1a73e8",
          fillOpacity: 0.15,
          clickable: false,
        });
        const button = yourLocationButton();
        button.addEventListener("click", (event) => {
          event.preventDefault();
          locateRef.current();
        });
        map.controls[maps.ControlPosition.RIGHT_BOTTOM].push(button);
        mapRef.current = map;
        markerRef.current = marker;
        youRef.current = you;
        accuracyRef.current = circle;
        locateBtnRef.current = button;
        listener = map.addListener("click", (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          if (event.placeId) {
            event.stop?.();
            selectPlaceRef.current(event.placeId, lat, lng);
            return;
          }
          selectRef.current(lat, lng);
        });
        you.addListener("click", () => {
          const fix = hereRef.current;
          if (fix) selectRef.current(fix.lat, fix.lng);
        });
        resizeTimer = setTimeout(() => maps.event.trigger(map, "resize"), 120);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      });

    return () => {
      cancelled = true;
      pinToken.current += 1;
      locateRun.current += 1;
      if (watchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      clearTimeout(settleRef.current);
      settleRef.current = null;
      clearTimeout(resizeTimer);
      clearTimeout(searchTimer.current);
      requestRef.current += 1;
      if (listener) listener.remove();
      if (mapRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapRef.current);
      }
      mapRef.current = null;
      markerRef.current = null;
      youRef.current = null;
      accuracyRef.current = null;
      locateBtnRef.current = null;
    };
  }, [open, mode]);

  if (!open) return null;
  return (
    <div className="map-modal" role="dialog" aria-modal="true">
      <div className="map-sheet">
        <div className="map-head">
          <strong>{mode === "drop" ? "Pin the drop" : "Pin the pickup"}</strong>
          <button type="button" className="btn alt" onClick={onClose}>Close</button>
        </div>
        <p className="fine">{hint}</p>
        {error && <span className="error">{error}</span>}
        <div className="map-search">
          <input
            type="text"
            value={query}
            placeholder={mode === "drop" ? "Search the drop place" : "Search the pickup place"}
            autoComplete="off"
            onChange={onSearch}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (suggestions[0]) chooseSuggestion(suggestions[0]);
              }
              if (event.key === "Escape") setSuggestions([]);
            }}
          />
          {suggestions.length > 0 && (
            <ul className="suggest-list map-suggest" role="listbox">
              {suggestions.map((item, index) => {
                const prediction = item.placePrediction;
                const main = prediction?.mainText ? String(prediction.mainText) : String(prediction?.text || "");
                const secondary = prediction?.secondaryText ? String(prediction.secondaryText) : "";
                return (
                  <li key={prediction?.placeId || `${main}-${index}`}>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        chooseSuggestion(item);
                      }}
                    >
                      <strong>{main}</strong>
                      {secondary && <span>{secondary}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div ref={box} className="map-canvas" />
        {here && here.accuracy > 1500 && (
          <button type="button" className="btn map-locate" onClick={() => selectAt(here.lat, here.lng)}>
            Select this location
          </button>
        )}
      </div>
    </div>
  );
}
