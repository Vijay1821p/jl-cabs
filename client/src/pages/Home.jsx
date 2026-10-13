import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BOOK_TRIPS, EXTRAS, LOCAL_PACKAGES, OUTSTATION_PACKAGES, VEHICLES, formatPhone, greetingWhatsAppUrl, inr, listedVehicles, requestVehicleWhatsAppUrl, tripImageSrc } from "@jc/shared";
import { api } from "../api.js";
import MapPick from "../components/MapPick.jsx";
import { bookQueryFromDraft, saveSearchDraft } from "../searchDraft.js";
import OfferBanner from "../components/OfferBanner.jsx";
import { useSite } from "../site.jsx";
import { taxiServiceJsonLd } from "../useSeo.js";
import { useTitle } from "../useTitle.js";

const BENEFITS = [
  ["One way, one distance", "On a one way trip you pay for the kilometres you travel, not for the driver's empty return."],
  ["Fare before you pay", "The fare uses the driving distance between pickup and drop, then the published per-km rate."],
  ["Extras listed first", "Toll, parking, permit, driver bata, extra kilometres and extra hours are shown before booking."],
  ["Open all day", "Call or WhatsApp any time. We confirm the driver after the booking is saved."],
  ["Two cars, clear rates", "Sedan and MUV rates are on the site. Other cars can be requested on WhatsApp."],
  ["Pay 25% or full", "Pay 25% now to confirm, or pay the full fare online through Razorpay."],
];

const STEPS = [
  ["1", "Enter the trip", "Choose one way, round trip or hourly. Add pickup, drop, date and time."],
  ["2", "See the fare", "We measure the road distance and apply the sedan or MUV rate, including the minimum kilometres."],
  ["3", "We confirm the cab", "Pay 25% or the full fare online. We call you with the driver details."],
];

function today() {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function QuoteCard() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState("one_way");
  const [vehicle, setVehicle] = useState("sedan");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState(1);
  const [packageKind, setPackageKind] = useState("local");
  const [hours, setHours] = useState(2);
  const [error, setError] = useState("");
  const [mapMode, setMap] = useState(null);
  const { site } = useSite();
  const localPacks = site.localPackages || LOCAL_PACKAGES;
  const outPacks = site.outstationPackages || OUTSTATION_PACKAGES;

  function search(event) {
    event.preventDefault();
    if (vehicle === "request") {
      window.open(requestVehicleWhatsAppUrl(site.company), "_blank", "noreferrer");
      return;
    }
    if (pickup.trim().length < 3 || drop.trim().length < 3) {
      setError("Enter both the pickup and the drop.");
      return;
    }
    const draft = {
      trip,
      vehicle,
      pickup: pickup.trim(),
      drop: drop.trim(),
      date,
      time,
      days,
      package_kind: packageKind,
      hours,
    };
    saveSearchDraft(draft);
    navigate(`/book?${bookQueryFromDraft(draft).toString()}`);
  }

  return (
    <form id="quote" className="quote-card" onSubmit={search}>
      <p className="kicker">Get a fare</p>
      <h2>Get a taxi fare</h2>
      <div className="chips">
        {BOOK_TRIPS.map((item) => (
          <button type="button" key={item.id} className={trip === item.id ? "chip on" : "chip"} onClick={() => {
            setTrip(item.id);
            if (item.id === "hourly") {
              setPackageKind("local");
              setHours(2);
            }
          }}>{item.label}</button>
        ))}
      </div>
      <label>Pickup location
        <span className="place-field">
          <input value={pickup} placeholder="Your pickup location" onChange={(e) => setPickup(e.target.value)} />
          <button type="button" className="map-btn" aria-label="Pick your location" onClick={() => setMap("pickup")}>
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
          </button>
        </span>
      </label>
      <label>Drop location
        <span className="place-field">
          <input value={drop} placeholder="Your drop location" onChange={(e) => setDrop(e.target.value)} />
          <button type="button" className="map-btn" aria-label="Pick your location" onClick={() => setMap("drop")}>
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
          </button>
        </span>
      </label>
      <MapPick
        open={Boolean(mapMode)}
        mode={mapMode || "pickup"}
        onPick={(field, name) => { if (field === "pickup") setPickup(name); else setDrop(name); }}
        onClose={() => setMap(null)}
      />
      <div className="grid two">
        <label>Date<input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>Time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      </div>
      {trip === "round" && (
        <label>Number of days
          <input type="number" min="1" max="30" value={days} onChange={(e) => setDays(Math.min(30, Math.max(1, Number(e.target.value) || 1)))} />
        </label>
      )}
      {trip === "hourly" && (
        <>
          <label>Package type
            <select value={packageKind} onChange={(e) => {
              const kind = e.target.value;
              setPackageKind(kind);
              setHours(kind === "outstation" ? 6 : 2);
            }}>
              <option value="local">Local trip package</option>
              <option value="outstation">Outstation trip package</option>
            </select>
          </label>
          {packageKind === "outstation" ? (
            <label>Outstation trip package
              <select value={hours <= 6 ? 6 : 10} onChange={(e) => setHours(Number(e.target.value))}>
                {outPacks.map((row) => <option key={row.id} value={row.hours}>{row.label}</option>)}
              </select>
            </label>
          ) : (
            <label>Local trip package
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                {localPacks.map((row) => <option key={row.hours} value={row.hours}>{row.hours} hrs & {row.km} km</option>)}
              </select>
            </label>
          )}
        </>
      )}
      <label>Vehicle
        <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
          {listedVehicles(VEHICLES).map((item) => (
            <option key={item.id} value={item.id}>{item.name} · {item.seats}</option>
          ))}
          <option value="request">Request a vehicle</option>
        </select>
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn full">{vehicle === "request" ? "Request on WhatsApp" : "Show fare"}</button>
      <p className="fine">The fare is calculated from the road distance. Name and mobile come on the next step.</p>
    </form>
  );
}

export default function Home() {
  useTitle(
    "Coimbatore Cab Service",
    "Jayalakshmi Cabs is a Coimbatore cab service for one-way taxi, round-trip, outstation taxi, airport taxi and hourly rental. Sedan and Ertiga / MUV. See the fare before you pay.",
    { path: "/", jsonLd: taxiServiceJsonLd() },
  );
  const { site } = useSite();
  const company = site.company;
  const vehicles = site.vehicles || VEHICLES;
  const wa = greetingWhatsAppUrl(company);
  const phone = formatPhone(company.phone);
  return (
    <>
      <section className="hero-band">
        <div className="wrap hero-grid">
          <div>
            <p className="kicker light">{site.pages.heroKicker}</p>
            <h1>{company.shortName}</h1>
            <p className="hero-tag">{company.tagline}</p>
            <p className="hero-lead">{site.pages.heroLead}</p>
            <OfferBanner tripDate={today()} tone="hero" />
            <div className="actions">
              <a className="btn call" href={`tel:+91${company.phone}`}>Call {phone}</a>
              <a className="btn wa-btn" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
          <QuoteCard />
        </div>
      </section>

      <section className="trust">
        <div className="wrap trust-row">
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 12.2 10.6 15 16 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Safe & Reliable<br />Journeys</span>
          </div>
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 16.5c1.1-2 2.4-3 4-3s2.9 1 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <span>Professional<br />Drivers</span>
          </div>
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M7 14h10l-1.2-3.2A2 2 0 0 0 14 9.5H10a2 2 0 0 0-1.8 1.3L7 14Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="15.4" r=".8" fill="currentColor" /><circle cx="15" cy="15.4" r=".8" fill="currentColor" /></svg>
            <span>Well-Maintained<br />Vehicles</span>
          </div>
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 13.5v-2a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 13.2h2.2v3.2H7.5A1.2 1.2 0 0 1 6.3 15v-.6a1.2 1.2 0 0 1 1.2-1.2Zm9 0h-2.2v3.2h2.2A1.2 1.2 0 0 0 17.7 15v-.6a1.2 1.2 0 0 0-1.2-1.2Z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            <span>24/7 Customer<br />Support</span>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="wrap">
          <p className="kicker">Services</p>
          <h2>One-way taxi, outstation taxi and hourly rental</h2>
          <div className="grid three" style={{ marginTop: 18 }}>
            {BOOK_TRIPS.map((trip) => (
              <Link key={trip.id} className="card service" to={`/book?trip=${trip.id}`}>
                <h3>{trip.label}</h3>
                <p>{{
                  one_way: "One-way taxi and airport taxi. You pay for the road distance you travel.",
                  round: "Round-trip taxi. The fare includes the journey back.",
                  hourly: "Local or outstation hour packages.",
                }[trip.id]}</p>
                <span className="more">Get a fare</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <p className="kicker">How booking works</p>
          <h2>Three steps</h2>
          <div className="grid steps" style={{ marginTop: 18 }}>
            {STEPS.map(([n, title, text]) => (
              <article key={n} className="card">
                <span className="step">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight" id="vehicles">
        <div className="wrap">
          <p className="kicker">Vehicles</p>
          <h2>Sedan and Ertiga cab service</h2>
          <div className="grid two" style={{ marginTop: 18 }}>
            {listedVehicles(vehicles).map((vehicle) => (
              <article key={vehicle.id} className="card vehicle">
                <div>
                  <h3>{vehicle.name}</h3>
                  <p>{vehicle.examples}</p>
                  <p>{vehicle.seats} seats, including the driver</p>
                </div>
                <div className="rate-pair">
                  <div><span>One way</span><b>{inr(vehicle.drop)}/km</b></div>
                  <div><span>Round trip</span><b>{inr(vehicle.round)}/km</b></div>
                </div>
                <Link className="btn" to={`/book?vehicle=${vehicle.id}`}>Book this car</Link>
              </article>
            ))}
            <article className="card vehicle">
              <div>
                <h3>Request a vehicle</h3>
                <p>Innova Crysta and other cars</p>
                <p>WhatsApp us for the fare</p>
              </div>
              <a className="btn" href={requestVehicleWhatsAppUrl(company)} target="_blank" rel="noreferrer">Request on WhatsApp</a>
            </article>
          </div>
        </div>
      </section>

      <PopularTrips />

      <section className="section tight">
        <div className="wrap">
          <p className="kicker">Why book here</p>
          <h2>What you can count on</h2>
          <div className="grid benefits" style={{ marginTop: 18 }}>
            {BENEFITS.map(([title, text]) => (
              <article key={title} className="card">
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight" id="faq">
        <div className="wrap grid two">
          <div>
            <p className="kicker">Questions</p>
            <h2>Before you book</h2>
            <div className="faq">
              <details open>
                <summary>Is the website price the final fare?</summary>
                <p>It is the fare for the road distance and the published rate, including driver bata and the minimum kilometres. Toll, parking, interstate permit, extra kilometres and extra hours are extra. We confirm the fare when we call.</p>
              </details>
              <details>
                <summary>What is charged extra?</summary>
                <ul>{EXTRAS.map((item) => <li key={item}>{item}</li>)}</ul>
              </details>
              <details>
                <summary>How do I pay?</summary>
                <p>UPI, Google Pay, PhonePe, credit card, debit card and net banking are inside Razorpay. Choose 25% now or the full fare.</p>
              </details>
              <details>
                <summary>When is the cab confirmed?</summary>
                <p>Saving a booking is a request. We call or WhatsApp you with the driver name and number.</p>
              </details>
            </div>
          </div>
          <aside className="card cta-card" id="contact">
            <p className="kicker">Need a cab now?</p>
            <h2>Call or WhatsApp</h2>
            <p>{phone}. Tell us the pickup, drop and time. We will share the fare before the car starts.</p>
            <div className="actions">
              <a className="btn call" href={`tel:+91${company.phone}`}>Call now</a>
              <a className="btn wa-btn" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function PopularTrips() {
  const [trips, setTrips] = useState([]);
  const [all, setAll] = useState(false);
  useEffect(() => {
    api("/api/trips").then((data) => setTrips(data.trips || [])).catch(() => setTrips([]));
  }, []);
  if (!trips.length) return null;
  const shown = all ? trips : trips.slice(0, 9);
  return (
    <section className="section tight" id="routes">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">Popular routes</p>
            <h2>Tourist places</h2>
          </div>
          {trips.length > 9 && (
            <button className="btn alt" type="button" onClick={() => setAll((v) => !v)}>{all ? "Show less" : "View all"}</button>
          )}
        </div>
        <div className="trip-grid">
          {shown.map((trip) => (
            <Link
              key={trip.id}
              className="trip-card"
              to={`/book?trip=${trip.trip_type || "one_way"}&vehicle=sedan&pickup=${encodeURIComponent(trip.from_place)}&drop=${encodeURIComponent(trip.to_place)}`}
            >
              <img src={tripImageSrc(trip.image_url)} alt={`${trip.from_place} to ${trip.to_place}`} />
              <div>
                <h3>{trip.from_place} to {trip.to_place}</h3>
                <p>{trip.km ? `${trip.km} km` : "Road distance on booking"}</p>
                <span>Book this trip</span>
              </div>
            </Link>
          ))}
        </div>
        <p className="fine">Kilometres are the usual road distance from Dharmapuri. The booking page uses the live map distance for the fare.</p>
      </div>
    </section>
  );
}
