import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { tripById, vehicleById, inr, invoiceWhatsAppUrl, officeWhatsAppUrl } from "@jc/shared";
import { useSite } from "../site.jsx";
import { api } from "../api.js";
import { useTitle } from "../useTitle.js";

const paymentLabel = {
  pending: "Online payment pending",
  paid: "Paid in full",
  advance: "25% paid · balance later",
  cash: "Cash / offline",
  failed: "Payment failed",
};
const bookingLabel = { requested: "Requested", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

export default function Track() {
  const { site } = useSite();
  useTitle(
    "Track Your Cab Booking",
    "Check a Jayalakshmi Cabs booking with your booking ID and mobile number.",
    { path: "/track" },
  );
  const [params, setParams] = useSearchParams();
  const [id, setId] = useState(params.get("booking") || "");
  const [mobile, setMobile] = useState(params.get("mobile") || "");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load(bookingId, phone) {
    setBusy(true);
    setError("");
    api(`/api/bookings/${bookingId.trim().toUpperCase()}?mobile=${phone.trim()}`)
      .then((data) => setBooking(data.booking))
      .catch((err) => {
        setBooking(null);
        setError(err.message);
      })
      .finally(() => setBusy(false));
  }

  useEffect(() => {
    const bookingId = params.get("booking");
    const phone = params.get("mobile");
    if (bookingId && phone) load(bookingId, phone);
  }, [params]);

  function search(event) {
    event.preventDefault();
    setParams({ booking: id.trim().toUpperCase(), mobile: mobile.trim() });
  }

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <p className="kicker">Track</p>
        <h1>Track your booking</h1>
        <form className="card" style={{ display: "grid", gap: 12, margin: "18px 0" }} onSubmit={search}>
          <label>Booking ID<input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="JCAB12CD" required /></label>
          <label>Mobile number<input inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} required /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Checking…" : "Show booking"}</button>
        </form>
        {booking && (
          <div className="card">
            <h2>{booking.booking_id}</h2>
            <div className="line"><span>Status</span><b>{bookingLabel[booking.booking_status] || booking.booking_status}</b></div>
            <div className="line"><span>Trip</span><b>{tripById(booking.trip_type)?.label} · {vehicleById(booking.vehicle_type)?.name}</b></div>
            <div className="line"><span>Route</span><b>{booking.pickup} → {booking.drop_location}</b></div>
            <div className="line"><span>When</span><b>{booking.trip_date} · {booking.trip_time}</b></div>
            <div className="line"><span>Payment</span><b>{paymentLabel[booking.payment_status] || booking.payment_status}</b></div>
            <div className="line"><span>Fare</span><b>{inr(booking.fare)}</b></div>
            <div className="line"><span>Driver</span><b>{booking.driver_name || "We will share the driver shortly."}</b></div>
            <div className="line"><span>Car number</span><b>{booking.vehicle_number || "—"}</b></div>
            {booking.driver_mobile && <div className="line"><span>Driver mobile</span><b>{booking.driver_mobile}</b></div>}
            <div className="actions" style={{ marginTop: 16 }}>
              <a className="btn" href={invoiceWhatsAppUrl(booking, booking.mobile, site.company, `${window.location.origin}/invoice?booking=${booking.booking_id}&mobile=${booking.mobile}`)} target="_blank" rel="noreferrer">WhatsApp invoice</a>
              <Link className="btn alt" to={`/invoice?booking=${booking.booking_id}&mobile=${booking.mobile}`}>View invoice</Link>
              <a className="btn alt" href={officeWhatsAppUrl(booking)} target="_blank" rel="noreferrer">WhatsApp office</a>
              <Link className="btn alt" to="/book">New booking</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
