import { useEffect, useRef, useState } from "react";
import L from "leaflet";

const HOME = [12.1211, 78.1583];

function pin(color) {
  return L.divIcon({
    className: "map-pin",
    html: `<span style="background:${color}">+</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

async function placeName(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await response.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function MapPick({ open, mode, onPick, onClose }) {
  const box = useRef(null);
  const pickRef = useRef(onPick);
  const closeRef = useRef(onClose);
  const [hint, setHint] = useState("Tap the map to choose the place.");
  pickRef.current = onPick;
  closeRef.current = onClose;

  useEffect(() => {
    if (!open || !box.current) return undefined;
    const map = L.map(box.current).setView(HOME, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);
    const mark = L.marker(HOME, { icon: pin(mode === "pickup" ? "#3b784a" : "#c0392b") });
    let placed = false;
    map.on("click", async (event) => {
      const { lat, lng } = event.latlng;
      if (!placed) {
        mark.setLatLng([lat, lng]).addTo(map);
        placed = true;
      } else mark.setLatLng([lat, lng]);
      map.setView([lat, lng], 15);
      setHint("Finding the place name…");
      try {
        const name = await placeName(lat, lng);
        pickRef.current(mode === "pickup" ? "pickup" : "drop_location", name);
        setHint("Place selected.");
        closeRef.current();
      } catch {
        setHint("Could not name that point. Tap again.");
      }
    });
    const resize = setTimeout(() => map.invalidateSize(), 80);
    return () => {
      clearTimeout(resize);
      map.remove();
    };
  }, [open, mode]);

  if (!open) return null;
  return (
    <div className="map-modal" role="dialog" aria-modal="true">
      <div className="map-sheet">
        <div className="map-head">
          <strong>Pick your location</strong>
          <button type="button" className="btn alt" onClick={onClose}>Close</button>
        </div>
        <p className="fine">{hint}</p>
        <div ref={box} className="map-canvas" />
      </div>
    </div>
  );
}
