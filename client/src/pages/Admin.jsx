import { useEffect, useState } from "react";
import { TRIP_IMAGES, bookingWhatsAppText, customerWhatsAppUrl, defaultSite, invoiceWhatsAppUrl, mergeSite, tripById, inr } from "@jc/shared";
import { adminToken, api } from "../api.js";
import { useSite } from "../site.jsx";
import { useTitle } from "../useTitle.js";

const blankTrip = { from_place: "Dharmapuri", to_place: "", km: "", fare: 0, trip_type: "one_way", image_url: "", sort_order: 0, visible: true };

export default function Admin() {
  useTitle("Admin", "Jayalakshmi Cabs booking dashboard.");
  const [token, setToken] = useState(adminToken.get() || "");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("bookings");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [trips, setTrips] = useState([]);
  const [draft, setDraft] = useState(blankTrip);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setSite } = useSite();
  const [rates, setRates] = useState(defaultSite());
  const [savedNote, setSavedNote] = useState("");

  async function loadBookings(activeToken, q = query) {
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/bookings?q=${encodeURIComponent(q)}`, { token: activeToken });
      setRows(data.bookings);
    } catch (err) {
      if (err.status === 401) {
        adminToken.clear();
        setToken("");
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrips(activeToken) {
    setError("");
    try {
      const data = await api("/api/admin/trips", { token: activeToken });
      setTrips(data.trips);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadSite(activeToken) {
    try {
      const data = mergeSite(await api("/api/site", { token: activeToken }));
      setRates(data);
      setSite(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSiteEdits(event) {
    event.preventDefault();
    setError("");
    setSavedNote("");
    try {
      const data = mergeSite(await api("/api/admin/site", { method: "PUT", token, body: rates }));
      setRates(data);
      setSite(data);
      setSavedNote("Saved. Phone, address, rates and page text now show on the website.");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!token) return undefined;
    loadBookings(token, "");
    loadTrips(token);
    loadSite(token);
    return undefined;
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/admin/login", { method: "POST", body: { password } });
      adminToken.set(data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function update(bookingId, body) {
    const data = await api(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      token,
      body,
    });
    setRows((current) => current.map((row) => (row.booking_id === bookingId ? data.booking : row)));
  }

  function setRow(bookingId, key, value) {
    setRows((current) => current.map((row) => (row.booking_id === bookingId ? { ...row, [key]: value } : row)));
  }

  async function saveTrip(event) {
    event.preventDefault();
    setError("");
    const body = {
      ...draft,
      km: Number(draft.km),
      fare: Number(draft.fare) || 0,
      sort_order: Number(draft.sort_order) || 0,
      visible: Boolean(draft.visible),
    };
    try {
      if (editing) {
        const data = await api(`/api/admin/trips/${editing}`, { method: "PATCH", token, body });
        setTrips((current) => current.map((row) => (row.id === editing ? data.trip : row)));
      } else {
        const data = await api("/api/admin/trips", { method: "POST", token, body });
        setTrips((current) => [...current, data.trip]);
      }
      setDraft(blankTrip);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTrip(id) {
    if (!window.confirm("Remove this popular trip from the home page?")) return;
    await api(`/api/admin/trips/${id}`, { method: "DELETE", token });
    setTrips((current) => current.filter((row) => row.id !== id));
  }

  if (!token) {
    return (
      <section className="section"><form className="wrap card" style={{ maxWidth: 420 }} onSubmit={login}>
        <h1>Admin login</h1>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" style={{ marginTop: 12 }}>Sign in</button>
      </form></section>
    );
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="actions">
          <h1>Admin</h1>
          <button className="btn alt" onClick={() => { adminToken.clear(); setToken(""); }}>Sign out</button>
        </div>
        <div className="chips">
          <button type="button" className={tab === "bookings" ? "chip on" : "chip"} onClick={() => setTab("bookings")}>Bookings</button>
          <button type="button" className={tab === "contact" ? "chip on" : "chip"} onClick={() => setTab("contact")}>Phone & address</button>
          <button type="button" className={tab === "rates" ? "chip on" : "chip"} onClick={() => setTab("rates")}>Rates & amounts</button>
          <button type="button" className={tab === "pages" ? "chip on" : "chip"} onClick={() => setTab("pages")}>Pages</button>
          <button type="button" className={tab === "offers" ? "chip on" : "chip"} onClick={() => setTab("offers")}>Festival offers</button>
          <button type="button" className={tab === "trips" ? "chip on" : "chip"} onClick={() => setTab("trips")}>Popular trips</button>
        </div>
        {error && <p className="error">{error}</p>}
        {savedNote && <p className="muted">{savedNote}</p>}

        {tab === "contact" && (
          <form className="card" style={{ display: "grid", gap: 14, marginTop: 16, maxWidth: 640 }} onSubmit={saveSiteEdits}>
            <p className="lead">Phone, WhatsApp and office address show on the header, footer, invoice and Call / WhatsApp buttons. Edit the address here any time and save.</p>
            <label>Website phone number
              <input inputMode="numeric" maxLength={10} value={rates.company.phone} onChange={(e) => setRates({ ...rates, company: { ...rates.company, phone: e.target.value.replace(/\D/g, "").slice(0, 10) } })} />
            </label>
            <label>Website WhatsApp number
              <input inputMode="numeric" maxLength={10} value={rates.company.whatsapp} onChange={(e) => setRates({ ...rates, company: { ...rates.company, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10) } })} />
            </label>
            <label>Office address
              <textarea
                rows={4}
                value={rates.company.address || ""}
                onChange={(e) => setRates({ ...rates, company: { ...rates.company, address: e.target.value } })}
                placeholder="Street, area, city, pincode"
              />
            </label>
            <p className="muted">This address appears on the website footer and on invoices. Change it and click Save.</p>
            <label>Website
              <input value={rates.company.website || ""} onChange={(e) => setRates({ ...rates, company: { ...rates.company, website: e.target.value.trim() } })} placeholder="https://jlcabs.com" />
            </label>
            <label>WhatsApp greeting message
              <textarea
                rows={6}
                value={rates.company.whatsappGreeting || ""}
                onChange={(e) => setRates({ ...rates, company: { ...rates.company, whatsappGreeting: e.target.value } })}
                placeholder="The message that opens when a customer taps WhatsApp"
              />
            </label>
            <p className="muted">This text is pre-filled when someone taps WhatsApp on the website. Change it any time and save.</p>
            <label>Instagram
              <input value={rates.company.instagram} onChange={(e) => setRates({ ...rates, company: { ...rates.company, instagram: e.target.value.replace(/^@/, "") } })} />
            </label>
            <label>State
              <input value={rates.company.state || ""} onChange={(e) => setRates({ ...rates, company: { ...rates.company, state: e.target.value } })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={Boolean(rates.company.gstEnabled)} onChange={(e) => setRates({ ...rates, company: { ...rates.company, gstEnabled: e.target.checked } })} />
              <span>Show GST on invoice (optional)</span>
            </label>
            {rates.company.gstEnabled && (
              <>
                <label>GSTIN
                  <input value={rates.company.gstin || ""} onChange={(e) => setRates({ ...rates, company: { ...rates.company, gstin: e.target.value.toUpperCase() } })} placeholder="33AAAAA0000A1Z5" />
                </label>
                <label>Cab GST % (inclusive)
                  <select value={String(rates.company.gstPercent ?? 5)} onChange={(e) => setRates({ ...rates, company: { ...rates.company, gstPercent: Number(e.target.value) } })}>
                    <option value="5">5% — usual cab / radio taxi (restricted ITC)</option>
                    <option value="18">18% — only if you claim full ITC</option>
                  </select>
                </label>
                <p className="muted">Leave GST off if you do not want tax on the invoice. When on, 5% inclusive (CGST 2.5% + SGST 2.5%, SAC 996412) is the usual cab rate. Use 18% only if your CA says you take full ITC.</p>
              </>
            )}
            <button className="btn">Save contact</button>
          </form>
        )}

        {tab === "rates" && (
          <form className="card" style={{ display: "grid", gap: 16, marginTop: 16 }} onSubmit={saveSiteEdits}>
            <p className="lead">These amounts appear on Tariff and are used for booking fares.</p>
            <h3>One-way fare up to 100 km</h3>
            <p className="muted">These fixed fares apply only on one-way trips of 100 km or less. From 101 km the one-way per-km rate is used.</p>
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Distance</th><th>Upto km</th><th>Sedan ₹</th><th>MUV ₹</th></tr></thead>
                <tbody>
                  {(rates.oneWaySlabs || []).map((row, index) => (
                    <tr key={row.upto + index}>
                      <td><input value={row.label} onChange={(e) => setRates((cur) => ({ ...cur, oneWaySlabs: cur.oneWaySlabs.map((item, i) => i === index ? { ...item, label: e.target.value } : item) }))} /></td>
                      <td><input type="number" min="1" value={row.upto} onChange={(e) => setRates((cur) => ({ ...cur, oneWaySlabs: cur.oneWaySlabs.map((item, i) => i === index ? { ...item, upto: Number(e.target.value) } : item) }))} /></td>
                      <td><input type="number" min="0" value={row.sedan} onChange={(e) => setRates((cur) => ({ ...cur, oneWaySlabs: cur.oneWaySlabs.map((item, i) => i === index ? { ...item, sedan: Number(e.target.value) } : item) }))} /></td>
                      <td><input type="number" min="0" value={row.muv} onChange={(e) => setRates((cur) => ({ ...cur, oneWaySlabs: cur.oneWaySlabs.map((item, i) => i === index ? { ...item, muv: Number(e.target.value) } : item) }))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Per-km rates</h3>
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Vehicle</th><th>One-way (start → drop) ₹/km</th><th>Round trip ₹/km</th></tr></thead>
                <tbody>
                  {rates.vehicles.map((vehicle, index) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.name}</td>
                      <td><input type="number" min="1" value={vehicle.drop} onChange={(e) => setRates((cur) => ({ ...cur, vehicles: cur.vehicles.map((row, i) => i === index ? { ...row, drop: Number(e.target.value) } : row) }))} /></td>
                      <td><input type="number" min="1" value={vehicle.round} onChange={(e) => setRates((cur) => ({ ...cur, vehicles: cur.vehicles.map((row, i) => i === index ? { ...row, round: Number(e.target.value) } : row) }))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Extra charges</h3>
            <div className="grid two">
              <label>Night charge (₹)<input type="number" min="0" value={rates.charges.nightCharge} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, nightCharge: Number(e.target.value) } })} /></label>
              <label>Waiting / hour (₹)<input type="number" min="0" value={rates.charges.waitingPerHour} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, waitingPerHour: Number(e.target.value) } })} /></label>
              <label>One-way min km<input type="number" min="1" value={rates.charges.oneWayMinKm} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, oneWayMinKm: Number(e.target.value) } })} /></label>
              <label>Round min km<input type="number" min="1" value={rates.charges.roundMinKm} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, roundMinKm: Number(e.target.value) } })} /></label>
              <label>Drop driver bata (₹)<input type="number" min="0" value={rates.charges.driverBata} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, driverBata: Number(e.target.value) } })} /></label>
              <label>Drop long bata (₹)<input type="number" min="0" value={rates.charges.driverBataLong} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, driverBataLong: Number(e.target.value) } })} /></label>
              <label>Round bata / day (₹)<input type="number" min="0" value={rates.charges.roundBataPerDay} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, roundBataPerDay: Number(e.target.value) } })} /></label>
              <label>Round long bata (₹)<input type="number" min="0" value={rates.charges.roundBataLong} onChange={(e) => setRates({ ...rates, charges: { ...rates.charges, roundBataLong: Number(e.target.value) } })} /></label>
            </div>
            <h3>Outstation packages</h3>
            {rates.outstationPackages.map((row, index) => (
              <div className="grid two" key={row.id}>
                <label>{row.label} sedan (₹)<input type="number" min="1" value={row.sedan} onChange={(e) => setRates((cur) => ({ ...cur, outstationPackages: cur.outstationPackages.map((item, i) => i === index ? { ...item, sedan: Number(e.target.value) } : item) }))} /></label>
                <label>{row.label} MUV (₹)<input type="number" min="1" value={row.muv} onChange={(e) => setRates((cur) => ({ ...cur, outstationPackages: cur.outstationPackages.map((item, i) => i === index ? { ...item, muv: Number(e.target.value) } : item) }))} /></label>
              </div>
            ))}
            <h3>Local packages</h3>
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Hours</th><th>Km</th><th>Sedan ₹</th><th>MUV ₹</th></tr></thead>
                <tbody>
                  {rates.localPackages.map((row, index) => (
                    <tr key={row.hours}>
                      <td>{row.hours}</td>
                      <td><input type="number" min="1" value={row.km} onChange={(e) => setRates((cur) => ({ ...cur, localPackages: cur.localPackages.map((item, i) => i === index ? { ...item, km: Number(e.target.value) } : item) }))} /></td>
                      <td><input type="number" min="1" value={row.sedan} onChange={(e) => setRates((cur) => ({ ...cur, localPackages: cur.localPackages.map((item, i) => i === index ? { ...item, sedan: Number(e.target.value) } : item) }))} /></td>
                      <td><input type="number" min="1" value={row.muv} onChange={(e) => setRates((cur) => ({ ...cur, localPackages: cur.localPackages.map((item, i) => i === index ? { ...item, muv: Number(e.target.value) } : item) }))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn">Save rates</button>
          </form>
        )}

        {tab === "pages" && (
          <form className="card" style={{ display: "grid", gap: 14, marginTop: 16 }} onSubmit={saveSiteEdits}>
            <p className="lead">Edit the text shown on Home, Tariff, Terms, Refund and Privacy. One line per extra charge or tariff term.</p>
            <h3>Company</h3>
            <div className="grid two">
              <label>Name<input value={rates.company.name} onChange={(e) => setRates({ ...rates, company: { ...rates.company, name: e.target.value } })} /></label>
              <label>Short name<input value={rates.company.shortName} onChange={(e) => setRates({ ...rates, company: { ...rates.company, shortName: e.target.value } })} /></label>
              <label>Tagline<input value={rates.company.tagline} onChange={(e) => setRates({ ...rates, company: { ...rates.company, tagline: e.target.value } })} /></label>
              <label>Website phone number<input inputMode="numeric" maxLength={10} value={rates.company.phone} onChange={(e) => setRates({ ...rates, company: { ...rates.company, phone: e.target.value.replace(/\D/g, "").slice(0, 10) } })} /></label>
              <label>Website WhatsApp number<input inputMode="numeric" maxLength={10} value={rates.company.whatsapp} onChange={(e) => setRates({ ...rates, company: { ...rates.company, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10) } })} /></label>
              <label>Instagram<input value={rates.company.instagram} onChange={(e) => setRates({ ...rates, company: { ...rates.company, instagram: e.target.value } })} /></label>
              <label>Website<input value={rates.company.website || ""} onChange={(e) => setRates({ ...rates, company: { ...rates.company, website: e.target.value.trim() } })} placeholder="https://jlcabs.com" /></label>
            </div>
            <label>Office address<textarea rows={3} value={rates.company.address || ""} onChange={(e) => setRates({ ...rates, company: { ...rates.company, address: e.target.value } })} placeholder="Street, area, city, pincode" /></label>
            <h3>Home</h3>
            <label>Hero line<input value={rates.pages.heroKicker} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, heroKicker: e.target.value } })} /></label>
            <label>Home paragraph<textarea rows={3} value={rates.pages.heroLead} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, heroLead: e.target.value } })} /></label>
            <label>Footer paragraph<textarea rows={2} value={rates.pages.footerBlurb} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, footerBlurb: e.target.value } })} /></label>
            <h3>Tariff</h3>
            <label>Tariff intro<textarea rows={2} value={rates.pages.tariffLead} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, tariffLead: e.target.value } })} /></label>
            <label>Terms & charges (one per line)<textarea rows={10} value={rates.tariffTerms.join("\n")} onChange={(e) => setRates({ ...rates, tariffTerms: e.target.value.split("\n") })} /></label>
            <label>Fare notice<textarea rows={2} value={rates.fareNotice} onChange={(e) => setRates({ ...rates, fareNotice: e.target.value })} /></label>
            <h3>Legal pages</h3>
            <label>Terms intro<textarea rows={5} value={rates.pages.termsIntro} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, termsIntro: e.target.value } })} /></label>
            <label>Luggage policy<textarea rows={3} value={rates.pages.luggage} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, luggage: e.target.value } })} /></label>
            <label>Refund policy (one rule per line)<textarea rows={5} value={rates.pages.refund} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, refund: e.target.value } })} /></label>
            <label>Privacy policy<textarea rows={5} value={rates.pages.privacy} onChange={(e) => setRates({ ...rates, pages: { ...rates.pages, privacy: e.target.value } })} /></label>
            <button className="btn">Save pages</button>
          </form>
        )}

        {tab === "offers" && (
          <form className="card" style={{ display: "grid", gap: 14, marginTop: 16 }} onSubmit={saveSiteEdits}>
            <p className="lead">Add Vijayadashami, Pongal or any festival offer. Leave the dates empty to keep it on until you hide it. Discount is optional — 0 means banner only, no fare cut.</p>
            {(rates.offers || []).map((offer, index) => (
              <div key={index} className="card" style={{ display: "grid", gap: 12, background: "#f7fbf8" }}>
                <div className="grid two">
                  <label>Offer title<input value={offer.title} placeholder="Vijayadashami offer" onChange={(e) => setRates((cur) => ({ ...cur, offers: cur.offers.map((row, i) => i === index ? { ...row, title: e.target.value } : row) }))} /></label>
                  <label>Discount %<input type="number" min="0" max="80" value={offer.discountPercent} onChange={(e) => setRates((cur) => ({ ...cur, offers: cur.offers.map((row, i) => i === index ? { ...row, discountPercent: Number(e.target.value) } : row) }))} /></label>
                  <label>Start date<input type="date" value={offer.startDate} onChange={(e) => setRates((cur) => ({ ...cur, offers: cur.offers.map((row, i) => i === index ? { ...row, startDate: e.target.value } : row) }))} /></label>
                  <label>End date<input type="date" value={offer.endDate} onChange={(e) => setRates((cur) => ({ ...cur, offers: cur.offers.map((row, i) => i === index ? { ...row, endDate: e.target.value } : row) }))} /></label>
                </div>
                <label>Message shown on the site<textarea rows={2} value={offer.message} placeholder="Book this week and get 10% off the published fare." onChange={(e) => setRates((cur) => ({ ...cur, offers: cur.offers.map((row, i) => i === index ? { ...row, message: e.target.value } : row) }))} /></label>
                <label className="check"><input type="checkbox" checked={offer.visible !== false} onChange={(e) => setRates((cur) => ({ ...cur, offers: cur.offers.map((row, i) => i === index ? { ...row, visible: e.target.checked } : row) }))} /> Show on the website</label>
                <button type="button" className="btn ghost" onClick={() => setRates((cur) => ({ ...cur, offers: cur.offers.filter((_, i) => i !== index) }))}>Remove this offer</button>
              </div>
            ))}
            <button type="button" className="btn ghost" onClick={() => setRates((cur) => ({ ...cur, offers: [...(cur.offers || []), { title: "", message: "", discountPercent: 0, startDate: "", endDate: "", visible: true }] }))}>Add festival offer</button>
            <button className="btn">Save offers</button>
          </form>
        )}

        {tab === "bookings" && (
          <>
            <form className="actions" onSubmit={(event) => { event.preventDefault(); loadBookings(token); }}>
              <input style={{ maxWidth: 360 }} placeholder="Search name, mobile, booking ID or place" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="btn">Search</button>
            </form>
            {loading && <p>Loading bookings…</p>}
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Booking</th><th>Customer</th><th>Trip</th><th>Fare</th><th>Payment</th><th>Driver / car</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.booking_id}>
                      <td>{row.booking_id}<br /><span className="muted">{row.trip_date} {row.trip_time}</span></td>
                      <td>{row.customer_name}<br />{row.mobile}</td>
                      <td>{tripById(row.trip_type)?.label}<br />{row.pickup} → {row.drop_location}</td>
                      <td>{inr(row.fare)}</td>
                      <td><span className={`status ${row.payment_status}`}>{row.payment_status}</span>{row.amount_paid ? <><br /><span className="muted">Paid {inr(row.amount_paid)}</span></> : null}</td>
                      <td style={{ minWidth: 180 }}>
                        <input placeholder="Driver name" value={row.driver_name || ""} onChange={(e) => setRow(row.booking_id, "driver_name", e.target.value)} />
                        <input placeholder="Car number" value={row.vehicle_number || ""} onChange={(e) => setRow(row.booking_id, "vehicle_number", e.target.value)} style={{ marginTop: 6 }} />
                        <input placeholder="Driver mobile" value={row.driver_mobile || ""} onChange={(e) => setRow(row.booking_id, "driver_mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} style={{ marginTop: 6 }} />
                        <div className="actions" style={{ marginTop: 8 }}>
                          <button type="button" className="btn small" onClick={() => update(row.booking_id, { driver_name: row.driver_name, vehicle_number: row.vehicle_number, driver_mobile: row.driver_mobile, booking_status: "confirmed" })}>Save driver</button>
                          <a className="btn alt small" href={invoiceWhatsAppUrl(row, row.mobile, rates.company, `${window.location.origin}/invoice?booking=${row.booking_id}&mobile=${row.mobile}`)} target="_blank" rel="noreferrer">WA invoice</a>
                          <a className="btn alt small" href={customerWhatsAppUrl(row, "Your driver details are above. Please be ready at pickup.")} target="_blank" rel="noreferrer">WA customer</a>
                          <a className="btn alt small" href={invoiceWhatsAppUrl(row, rates.company.whatsapp, rates.company, `${window.location.origin}/invoice?booking=${row.booking_id}&mobile=${row.mobile}`)} target="_blank" rel="noreferrer">WA office invoice</a>
                          <a className="btn alt small" href={`https://wa.me/91${rates.company.whatsapp}?text=${encodeURIComponent(bookingWhatsAppText(row))}`} target="_blank" rel="noreferrer">WA office</a>
                        </div>
                      </td>
                      <td>
                        <select value={row.booking_status} onChange={(e) => update(row.booking_id, { booking_status: e.target.value })}>
                          <option value="requested">Requested</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && !loading && <tr><td colSpan="7">No bookings yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "trips" && (
          <>
            <p className="lead">These tourist-place cards appear on the home page. Show the road kilometres only — no one-way taxi fare.</p>
            <form className="card grid two" style={{ margin: "16px 0" }} onSubmit={saveTrip}>
              <label>From<input value={draft.from_place} onChange={(e) => setDraft({ ...draft, from_place: e.target.value })} required /></label>
              <label>Tourist place<input value={draft.to_place} onChange={(e) => setDraft({ ...draft, to_place: e.target.value })} required /></label>
              <label>Distance (km)<input type="number" min="1" value={draft.km} onChange={(e) => setDraft({ ...draft, km: e.target.value })} required /></label>
              <label>Order<input type="number" min="0" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} /></label>
              <label>Photo
                <select value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}>
                  <option value="">Choose a stored photo</option>
                  {TRIP_IMAGES.map((image) => (
                    <option key={image.id} value={image.file}>{image.label}</option>
                  ))}
                </select>
              </label>
              <label>Show on home
                <select value={draft.visible ? "yes" : "no"} onChange={(e) => setDraft({ ...draft, visible: e.target.value === "yes" })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <div className="actions">
                <button className="btn">{editing ? "Save trip" : "Add trip"}</button>
                {editing && <button type="button" className="btn alt" onClick={() => { setDraft(blankTrip); setEditing(null); }}>Cancel</button>}
              </div>
            </form>
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Route</th><th>Distance</th><th>Order</th><th>Shown</th><th></th></tr></thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>{trip.from_place} → {trip.to_place}</td>
                      <td>{trip.km ? `${trip.km} km` : "—"}</td>
                      <td>{trip.sort_order}</td>
                      <td>{trip.visible ? "Yes" : "No"}</td>
                      <td>
                        <button type="button" className="btn alt" onClick={() => { setEditing(trip.id); setDraft({ ...trip, km: String(trip.km || ""), fare: String(trip.fare || 0) }); }}>Edit</button>
                        {" "}
                        <button type="button" className="btn alt" onClick={() => removeTrip(trip.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
