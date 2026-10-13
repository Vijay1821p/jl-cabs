import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TARIFF_TERMS, tripById, vehicleById, amountDueNow, balanceDue, inr } from "@jc/shared";
import { api } from "../api.js";
import { useTitle } from "../useTitle.js";

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("The payment window could not be loaded."));
    document.body.appendChild(script);
  });
}

export default function Payment() {
  useTitle("Payment", "Pay 25% now or the full fare online.");
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("jc_draft");
    if (!saved) navigate("/book", { replace: true });
    else setDraft(JSON.parse(saved));
    api("/api/config").then((config) => setOnline(config.razorpay)).catch(() => setOnline(false));
  }, [navigate]);

  if (!draft) return <section className="section"><div className="wrap">Loading payment details…</div></section>;
  const trip = tripById(draft.trip_type);
  const vehicle = vehicleById(draft.vehicle_type);
  const choice = draft.payment_choice === "full" ? "full" : "advance";
  const nowDue = amountDueNow(draft.quote.fare, choice);
  const later = choice === "full" ? 0 : balanceDue(draft.quote.fare);

  async function saveBooking() {
    const result = await api("/api/bookings", {
      method: "POST",
      body: { ...draft, hours: Number(draft.hours), days: Number(draft.days) || 1, payment_choice: choice },
    });
    return result.booking;
  }

  function goSuccess(booking) {
    navigate(`/success?booking=${booking.booking_id}&mobile=${booking.mobile}`);
  }

  async function payOnline() {
    setBusy("online");
    setError("");
    try {
      const booking = await saveBooking();
      const order = await api("/api/payments/create-order", {
        method: "POST",
        body: { booking_id: booking.booking_id, mobile: booking.mobile },
      });
      await loadCheckout();
      const response = await new Promise((resolve) => {
        const checkout = new window.Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: order.name,
          description: order.description,
          prefill: order.prefill,
          theme: { color: "#2f6b45" },
          handler: resolve,
          modal: { ondismiss: () => resolve(null) },
        });
        checkout.open();
      });
      if (!response) {
        goSuccess(booking);
        return;
      }
      const verified = await api("/api/payments/verify", { method: "POST", body: { booking_id: booking.booking_id, ...response } });
      goSuccess(verified.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="section">
      <div className="wrap grid two">
        <div className="card">
          <p className="kicker">Payment</p>
          <h1>Pay {inr(nowDue)} now</h1>
          <p>{vehicle?.name} · {trip?.label}</p>
          <p>{draft.pickup} → {draft.drop_location}</p>
          <p>{draft.trip_date} · {draft.trip_time}</p>
          {choice === "full" && <p>You chose to pay the full estimated fare online. The invoice will show paid in full.</p>}
          {choice === "advance" && <p>You chose 25% now. The invoice will show {inr(nowDue)} paid and {inr(later)} balance.</p>}
          <h2 style={{ marginTop: 18 }}>Terms & Charges</h2>
          <ul className="terms">{TARIFF_TERMS.map((item) => <li key={item}>{item}</li>)}</ul>
          {error && <p className="error">{error}</p>}
          {online ? (
            <button className="btn full" disabled={Boolean(busy)} onClick={payOnline}>
              {busy === "online" ? "Opening payment…" : `Pay ${choice === "full" ? "full fare" : "25%"} · ${inr(nowDue)}`}
            </button>
          ) : (
            <p className="banner">Online payment is not switched on yet. Add Razorpay keys, or call the office.</p>
          )}
          <p><Link to="/book">Edit booking</Link> · <Link to="/refund">Refund policy</Link></p>
        </div>
        <aside className="card">
          <h2>Invoice preview</h2>
          {draft.quote.lines.map((line) => <div className="line" key={line.label}><span>{line.label}</span><b>{line.value}</b></div>)}
          <div className="total"><span>Total fare</span><span>{inr(draft.quote.fare)}</span></div>
          <div className="line"><span>{choice === "full" ? "Pay now (online full)" : "Pay now (online 25%)"}</span><b>{inr(nowDue)}</b></div>
          {choice !== "full" && <div className="line"><span>Pay later</span><b>{inr(later)}</b></div>}
        </aside>
      </div>
    </section>
  );
}
