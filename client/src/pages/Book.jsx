import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BOOK_TRIPS, CHARGES, LOCAL_PACKAGES, OUTSTATION_PACKAGES, TARIFF_TERMS, VEHICLES, amountDueNow, balanceDue, inr, isNightStart, listedVehicles, normalizeTime, normalizeVehicle, requestVehicleWhatsAppUrl, withNightCharge } from "@jc/shared";
import { api } from "../api.js";
import AddressAutocomplete from "../components/AddressAutocomplete.jsx";
import MapPick from "../components/MapPick.jsx";
import OfferBanner from "../components/OfferBanner.jsx";
import { readSearchDraft } from "../searchDraft.js";
import { useSite } from "../site.jsx";
import { useTitle } from "../useTitle.js";

const empty = {
  customer_name: "",
  mobile: "",
  pickup: "",
  drop_location: "",
  trip_date: "",
  trip_time: "",
  trip_type: "one_way",
  vehicle_type: "sedan",
  hours: 2,
  days: 1,
  package_kind: "local",
  payment_choice: "advance",
  accepted: false,
};

function bookVehicleId(value) {
  const vehicle = normalizeVehicle(value);
  if (vehicle === "sedan" || vehicle === "suv") return vehicle;
  if (value === "request" || vehicle === "muv" || vehicle === "crysta") return "request";
  return "sedan";
}

function today() {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formFromParams(params) {
  const search = params && typeof params.get === "function" ? params : new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const saved = readSearchDraft();
  const trip = search.get("trip") || saved.trip;
  const vehicle = search.get("vehicle") || saved.vehicle;
  const fromOutstation = trip === "outstation";
  const pack = search.get("package") || saved.package_kind;
  const packageKind = fromOutstation || pack === "outstation" ? "outstation" : "local";
  const hoursFromUrl = Number(search.get("hours") || saved.hours || 0);
  return {
    ...empty,
    trip_type: fromOutstation ? "hourly" : ["one_way", "round", "hourly"].includes(trip) ? trip : "one_way",
    package_kind: packageKind,
    hours: hoursFromUrl || (packageKind === "outstation" ? 6 : empty.hours),
    vehicle_type: bookVehicleId(vehicle),
    pickup: search.get("pickup") || saved.pickup || "",
    drop_location: search.get("drop") || search.get("drop_location") || saved.drop || saved.drop_location || "",
    trip_date: search.get("date") || saved.date || "",
    trip_time: search.get("time") || saved.time || "",
    days: Math.min(30, Math.max(1, Number(search.get("days") || saved.days || 1))),
  };
}

function pointFromParams(params, kind) {
  const search = params && typeof params.get === "function" ? params : new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const saved = readSearchDraft();
  const lat = Number(search.get(`${kind}_lat`) || saved[`${kind}_lat`]);
  const lng = Number(search.get(`${kind}_lng`) || saved[`${kind}_lng`]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = kind === "pickup"
    ? (search.get("pickup") || saved.pickup || "")
    : (search.get("drop") || search.get("drop_location") || saved.drop || saved.drop_location || "");
  return { address, lat, lng };
}

function quoteCoords(point, prefix) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return {};
  return { [`${prefix}_lat`]: point.lat, [`${prefix}_lng`]: point.lng };
}

export default function Book() {
  useTitle(
    "Book a One-Way Taxi or Outstation Cab",
    "Enter pickup, drop, date and vehicle to see the Jayalakshmi Cabs fare for a one-way taxi, round trip or hourly rental.",
    { path: "/book" },
  );
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const search = params.toString();
  const [form, setForm] = useState(() => formFromParams(new URLSearchParams(typeof window !== "undefined" ? window.location.search : search)));

  useEffect(() => {
    const next = formFromParams(new URLSearchParams(search || window.location.search));
    if (!next.pickup && !next.drop_location && !next.trip_date) return;
    setForm((current) => ({
      ...current,
      trip_type: next.trip_type || current.trip_type,
      package_kind: next.package_kind || current.package_kind,
      hours: next.hours || current.hours,
      vehicle_type: next.vehicle_type || current.vehicle_type,
      pickup: next.pickup || current.pickup,
      drop_location: next.drop_location || current.drop_location,
      trip_date: next.trip_date || current.trip_date,
      trip_time: next.trip_time || current.trip_time,
      days: next.days || current.days,
    }));
    const pickupPin = pointFromParams(new URLSearchParams(search || window.location.search), "pickup");
    const dropPin = pointFromParams(new URLSearchParams(search || window.location.search), "drop");
    if (pickupPin) setPickupPoint(pickupPin);
    if (dropPin) setDropPoint(dropPin);
  }, [search]);
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [mapMode, setMapMode] = useState(null);
  const [pickupPoint, setPickupPoint] = useState(() => pointFromParams(new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""), "pickup"));
  const [dropPoint, setDropPoint] = useState(() => pointFromParams(new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""), "drop"));
  const { site } = useSite();
  const vehicles = listedVehicles(site.vehicles || VEHICLES);
  const requestWa = requestVehicleWhatsAppUrl(site.company);
  const charges = site.charges || CHARGES;
  const localPacks = site.localPackages || LOCAL_PACKAGES;
  const outPacks = site.outstationPackages || OUTSTATION_PACKAGES;
  const terms = site.tariffTerms || TARIFF_TERMS;
  const hourly = form.trip_type === "hourly";
  const roundTrip = form.trip_type === "round";
  const fareType = hourly && form.package_kind === "outstation" ? "outstation" : form.trip_type;
  const shown = withNightCharge(quote, fareType, form.trip_time, site);

  function setMap(mode) {
    setMapMode(mode);
  }

  function set(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "trip_type" && value === "hourly" && current.trip_type !== "hourly") {
        next.package_kind = "local";
        next.hours = 2;
      }
      if (key === "package_kind" && value === "outstation" && Number(current.hours) < 6) next.hours = 6;
      if (key === "package_kind" && value === "local" && Number(current.hours) > 15) next.hours = 2;
      return next;
    });
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  useEffect(() => {
    if (form.vehicle_type === "request") {
      setQuote(null);
      setQuoteError("");
      return undefined;
    }
    if (form.pickup.trim().length < 3 || form.drop_location.trim().length < 3) return undefined;
    const timer = setTimeout(() => {
      setQuoting(true);
      setQuoteError("");
      api("/api/quote", {
        method: "POST",
        body: {
          pickup: form.pickup,
          drop_location: form.drop_location,
          trip_type: fareType,
          vehicle_type: normalizeVehicle(form.vehicle_type),
          hours: Number(form.hours),
          days: Number(form.days) || 1,
          trip_date: form.trip_date || undefined,
          trip_time: normalizeTime(form.trip_time) || undefined,
          ...quoteCoords(pickupPoint, "pickup"),
          ...quoteCoords(dropPoint, "drop"),
        },
      })
        .then((data) => setQuote(data))
        .catch((error) => {
          setQuote(null);
          setQuoteError(error.message);
        })
        .finally(() => setQuoting(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [form.pickup, form.drop_location, form.trip_type, form.package_kind, form.vehicle_type, form.hours, form.days, form.trip_time, form.trip_date, pickupPoint, dropPoint]);

  function validate() {
    const next = {};
    if (form.customer_name.trim().length < 2) next.customer_name = "Enter the customer name.";
    if (!/^[6-9]\d{9}$/.test(form.mobile)) next.mobile = "Enter a valid 10-digit mobile number.";
    if (form.pickup.trim().length < 3) next.pickup = "Enter the pickup location.";
    if (form.drop_location.trim().length < 3) next.drop_location = "Enter the drop location.";
    if (!form.trip_date) next.trip_date = "Select a date.";
    else if (form.trip_date < today()) next.trip_date = "The date cannot be in the past.";
    if (!form.trip_time) next.trip_time = "Select a time.";
    if (!form.accepted) next.accepted = "Please accept the terms.";
    if (form.vehicle_type !== "request" && !shown?.fare) next.fare = quoteError || "Wait for the fare, or check the locations.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueToPay(event) {
    event.preventDefault();
    if (form.vehicle_type === "request") {
      event.preventDefault();
      window.open(requestWa, "_blank", "noreferrer");
      return;
    }
    if (!validate()) return;
    sessionStorage.setItem("jc_draft", JSON.stringify({
      ...form,
      trip_type: fareType,
      quote: shown,
      ...quoteCoords(pickupPoint, "pickup"),
      ...quoteCoords(dropPoint, "drop"),
    }));
    navigate("/payment");
  }

  return (
    <section className="section">
      <div className="wrap">
        <p className="kicker">Booking</p>
        <h1>Book a one-way taxi or outstation cab</h1>
        <p className="lead">Trip details from the home page stay here. The fare appears after pickup and drop are filled.</p>
        <OfferBanner tripDate={form.trip_date} />
        <form className="grid two book-layout" style={{ marginTop: 20 }} onSubmit={continueToPay}>
          <div className="card" style={{ display: "grid", gap: 14 }}>
            <div className="chips">
              {BOOK_TRIPS.map((trip) => (
                <button type="button" key={trip.id} className={form.trip_type === trip.id ? "chip on" : "chip"} onClick={() => set("trip_type", trip.id)}>{trip.label}</button>
              ))}
            </div>
            <div className="chips">
              {vehicles.map((vehicle) => (
                <button type="button" key={vehicle.id} className={form.vehicle_type === vehicle.id ? "chip on" : "chip"} onClick={() => set("vehicle_type", vehicle.id)}>{vehicle.name}</button>
              ))}
              <button type="button" className={form.vehicle_type === "request" ? "chip on" : "chip"} onClick={() => set("vehicle_type", "request")}>Request a vehicle</button>
            </div>
            <AddressAutocomplete label="Pickup location" value={form.pickup} point={pickupPoint} onChange={(value, point) => { set("pickup", value); setPickupPoint(point || null); }} placeholder="Your pickup location" error={errors.pickup}>
              <button type="button" className="map-btn" aria-label="Pin pickup on the map" onClick={() => setMap("pickup")}>
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
              </button>
            </AddressAutocomplete>
            <AddressAutocomplete label="Drop location" value={form.drop_location} point={dropPoint} onChange={(value, point) => { set("drop_location", value); setDropPoint(point || null); }} placeholder="Your drop location" error={errors.drop_location}>
              <button type="button" className="map-btn" aria-label="Pin drop on the map" onClick={() => setMap("drop")}>
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
              </button>
            </AddressAutocomplete>
            <MapPick
              open={Boolean(mapMode)}
              mode={mapMode || "pickup"}
              onPick={(field, address, point) => {
                set(field, address);
                if (field === "pickup") setPickupPoint(point);
                else setDropPoint(point);
              }}
              onClose={() => setMapMode(null)}
            />
            <div className="grid two">
              <label>Date<input type="date" min={today()} value={form.trip_date} onChange={(e) => set("trip_date", e.target.value)} />{errors.trip_date && <span className="error">{errors.trip_date}</span>}</label>
              <label>Time
                <input type="time" value={form.trip_time} onChange={(e) => set("trip_time", e.target.value)} />
                {isNightStart(form.trip_time, charges) && (
                  <span className="error">Night charge ₹{charges.nightCharge} is added (11:00 PM – 5:00 AM).</span>
                )}
                {!isNightStart(form.trip_time, charges) && (
                  <span className="muted">Trips starting 11:00 PM to 5:00 AM add a night charge of ₹{charges.nightCharge}.</span>
                )}
                {errors.trip_time && <span className="error">{errors.trip_time}</span>}
              </label>
            </div>
            {roundTrip && (
              <label>Number of days
                <input type="number" min="1" max="30" value={form.days} onChange={(e) => set("days", Math.min(30, Math.max(1, Number(e.target.value) || 1)))} />
              </label>
            )}
            {hourly && (
              <>
                <label>Package type
                  <select value={form.package_kind} onChange={(e) => set("package_kind", e.target.value)}>
                    <option value="local">Local trip package</option>
                    <option value="outstation">Outstation trip package</option>
                  </select>
                </label>
                {form.package_kind === "outstation" ? (
                  <label>Outstation trip package
                    <select value={form.hours <= 6 ? 6 : 10} onChange={(e) => set("hours", Number(e.target.value))}>
                      {outPacks.map((row) => <option key={row.id} value={row.hours}>{row.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <label>Local trip package
                    <select value={form.hours} onChange={(e) => set("hours", Number(e.target.value))}>
                      {localPacks.map((row) => <option key={row.hours} value={row.hours}>{row.hours} hrs & {row.km} km</option>)}
                    </select>
                  </label>
                )}
              </>
            )}
            <p className="muted">Trip details from the home page are kept here. Add your name and mobile to continue.</p>
            <label>Customer name<input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />{errors.customer_name && <span className="error">{errors.customer_name}</span>}</label>
            <label>Mobile number<input inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} />{errors.mobile && <span className="error">{errors.mobile}</span>}</label>
            <fieldset className="pay-choice">
              <legend>How will you pay?</legend>
              <label className={form.payment_choice === "advance" ? "pay-opt on" : "pay-opt"}>
                <input type="radio" name="pay" checked={form.payment_choice === "advance"} onChange={() => set("payment_choice", "advance")} />
                <span>
                  <strong>Pay 25% now</strong>
                  <em>Confirm the booking with the advance. The remaining 75% is paid later.</em>
                </span>
              </label>
              <label className={form.payment_choice === "full" ? "pay-opt on" : "pay-opt"}>
                <input type="radio" name="pay" checked={form.payment_choice === "full"} onChange={() => set("payment_choice", "full")} />
                <span>
                  <strong>Pay full fare now</strong>
                  <em>Pay the complete estimated fare online.</em>
                </span>
              </label>
            </fieldset>
            <label className="check"><input type="checkbox" checked={form.accepted} onChange={(e) => set("accepted", e.target.checked)} /><span>I agree to the <Link to="/terms">terms</Link>, extra charges below, and the <Link to="/privacy">privacy policy</Link>.</span></label>
            {errors.accepted && <span className="error">{errors.accepted}</span>}
            <h3>Terms & Charges</h3>
            <ul className="terms">{terms.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <aside className="card summary">
            <h2>Fare estimate</h2>
            {form.vehicle_type === "request" ? (
              <p>Innova Crysta and other cars are on request. WhatsApp us and we will share the fare.</p>
            ) : (
              <>
                {quoting && <p>Calculating the road distance…</p>}
                {quoteError && <p className="error">{quoteError}</p>}
                {shown?.lines?.map((line) => <div className="line" key={line.label}><span>{line.label}</span><b>{line.value}</b></div>)}
                <div className="total"><span>Estimated fare</span><span>{shown ? inr(shown.fare) : "—"}</span></div>
                {shown && (
                  <>
                    <div className="line"><span>{form.payment_choice === "full" ? "Pay now (full)" : "Pay now (25%)"}</span><b>{inr(amountDueNow(shown.fare, form.payment_choice))}</b></div>
                    {form.payment_choice !== "full" && <div className="line"><span>Pay later</span><b>{inr(balanceDue(shown.fare))}</b></div>}
                  </>
                )}
                {errors.fare && <p className="error">{errors.fare}</p>}
              </>
            )}
            <button className="btn full" style={{ marginTop: 16 }} disabled={quoting && form.vehicle_type !== "request"}>
              {form.vehicle_type === "request" ? "Request on WhatsApp" : "Continue to payment"}
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
}
