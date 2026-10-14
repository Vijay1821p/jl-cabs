import { useEffect, useId, useRef, useState } from "react";
import { loadGooglePlaces } from "../googleMaps.js";
import {
  parseDistrictFromAddress,
  pointWithDistrict,
} from "../placeAddress.js";
import { pointAfterAddressEdit } from "../placePoint.js";

function predictionText(prediction, field) {
  const value = prediction?.[field];
  return value ? String(value) : "";
}

function districtText(selected) {
  return selected?.district || parseDistrictFromAddress(selected?.address) || "";
}

export default function AddressAutocomplete({ label, value, point, onChange, placeholder, error, children, showCoordinates = true, showDistrict = true }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const sessionRef = useRef(null);
  const requestRef = useRef(0);
  const timerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [openList, setOpenList] = useState(false);
  const [active, setActive] = useState(0);
  const [loadError, setLoadError] = useState("");
  onChangeRef.current = onChange;

  useEffect(() => {
    const input = inputRef.current;
    if (!input || input.value === (value || "")) return;
    input.value = value || "";
    setSelected(point && point.address === value ? point : null);
  }, [value, point]);

  useEffect(() => {
    if (point?.address) setSelected(point);
  }, [point]);

  useEffect(() => () => {
    requestRef.current += 1;
    clearTimeout(timerRef.current);
  }, []);

  function publish(address, nextPoint) {
    if (inputRef.current) inputRef.current.value = address;
    setSelected(nextPoint);
    onChangeRef.current(address, nextPoint);
  }

  async function search(text) {
    const query = text.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOpenList(false);
      return;
    }
    const requestId = ++requestRef.current;
    try {
      const places = await loadGooglePlaces();
      if (requestId !== requestRef.current) return;
      if (!sessionRef.current) sessionRef.current = new places.AutocompleteSessionToken();
      const { suggestions: next } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedRegionCodes: ["in"],
        sessionToken: sessionRef.current,
      });
      if (requestId !== requestRef.current) return;
      setLoadError("");
      setSuggestions(next || []);
      setActive(0);
      setOpenList((next || []).length > 0);
    } catch (searchError) {
      if (requestId !== requestRef.current) return;
      setSuggestions([]);
      setOpenList(false);
      setLoadError(searchError.message || "Address suggestions are unavailable.");
    }
  }

  async function choose(suggestion) {
    const prediction = suggestion?.placePrediction;
    if (!prediction) return;
    setOpenList(false);
    setSuggestions([]);
    const fallback = predictionText(prediction, "text");
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location", "addressComponents"] });
      sessionRef.current = null;
      const lat = place.location?.lat?.();
      const lng = place.location?.lng?.();
      const nextPoint = Number.isFinite(lat) && Number.isFinite(lng)
        ? pointWithDistrict(place.formattedAddress || place.displayName || fallback, lat, lng, place.addressComponents)
        : null;
      const address = nextPoint?.address || fallback;
      publish(address, nextPoint);
    } catch {
      sessionRef.current = null;
      publish(fallback, null);
    }
  }

  function change(event) {
    const next = event.target.value;
    const kept = pointAfterAddressEdit(next, selected);
    setSelected(kept);
    onChange(next, kept);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(next), 250);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpenList(true);
      setActive((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setOpenList(true);
      setActive((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === "Escape") {
      setOpenList(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (openList && suggestions[active]) choose(suggestions[active]);
    }
  }

  return (
    <div className="address-block">
      <label htmlFor={inputId}>{label}</label>
      <span className="place-field">
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            defaultValue={value || ""}
            onChange={change}
            onKeyDown={onKeyDown}
            onFocus={() => suggestions.length && setOpenList(true)}
            onBlur={() => setTimeout(() => setOpenList(false), 180)}
            role="combobox"
            aria-expanded={openList}
            aria-autocomplete="list"
          />
          {children}
          {openList && suggestions.length > 0 && (
            <ul className="suggest-list" role="listbox">
              {suggestions.map((item, index) => {
                const prediction = item.placePrediction;
                const main = predictionText(prediction, "mainText") || predictionText(prediction, "text");
                const secondary = predictionText(prediction, "secondaryText");
                return (
                  <li key={prediction?.placeId || `${main}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      className={index === active ? "is-on" : ""}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        choose(item);
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
      </span>
      {loadError && <span className="error">{loadError}</span>}
      {error && <span className="error">{error}</span>}
      <div className="place-meta">
        <p><strong>Selected Address:</strong> <span>{selected?.address || "-"}</span></p>
        {showDistrict && (
          <p><strong>District:</strong> <span>{districtText(selected) || "-"}</span></p>
        )}
        {showCoordinates && (
          <>
            <p><strong>Latitude:</strong> <span>{selected ? selected.lat : "-"}</span></p>
            <p><strong>Longitude:</strong> <span>{selected ? selected.lng : "-"}</span></p>
          </>
        )}
      </div>
    </div>
  );
}
