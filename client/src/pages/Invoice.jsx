import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatPhone, gstApplies, invoiceBalance, invoicePaid, invoiceTax, invoiceWhatsAppUrl, inr, paymentModeLabel, tripById, vehicleById } from "@jc/shared";
import { api } from "../api.js";
import { useSite } from "../site.jsx";
import { useTitle } from "../useTitle.js";

export function InvoiceBody({ booking, company }) {
  const showGst = gstApplies(company);
  const tax = invoiceTax(booking.fare, company);
  const paid = invoicePaid(booking);
  const due = invoiceBalance(booking);
  const trip = tripById(booking.trip_type)?.label || booking.trip_type;
  const vehicleMeta = vehicleById(booking.vehicle_type);
  const vehicle = vehicleMeta?.name || booking.vehicle_type;
  const issued = booking.created_at ? String(booking.created_at).slice(0, 10) : booking.trip_date;
  const lines = Array.isArray(booking.fare_lines) ? booking.fare_lines : [];
  const km = Number(booking.distance_km || 0);
  const hours = Number(booking.hours || 0);
  const days = Number(booking.days || 0);
  const showHours = booking.trip_type === "hourly" || booking.trip_type === "outstation";
  const showDays = booking.trip_type === "round";

  return (
    <div className="tax-invoice" id="jc-invoice">
      <header className="inv-head">
        <img className="inv-logo" src="/logo.png?v=2" alt={company.name} />
        <div className="inv-office">
          <strong>{company.name}</strong>
          <span>{company.tagline}</span>
          <span className="inv-address">{company.address}</span>
          <span>State: {company.state || "Tamil Nadu"}</span>
          <span>Phone: {formatPhone(company.phone)} · WhatsApp: {formatPhone(company.whatsapp)}</span>
          {showGst && <span>GSTIN: {company.gstin || "To be updated on admin"}</span>}
        </div>
        <div className="inv-meta">
          <b>{showGst ? "TAX INVOICE" : "INVOICE"}</b>
          <span>Invoice no. {booking.booking_id}</span>
          <span>Date {issued}</span>
          <span>State {company.state || "Tamil Nadu"}</span>
        </div>
      </header>

      <div className="inv-grid">
        <div>
          <h3>Bill to</h3>
          <p><b>{booking.customer_name}</b></p>
          <p>Mobile: {booking.mobile}</p>
        </div>
        <div>
          <h3>Trip</h3>
          <p>{trip}</p>
          <p>Start point: {booking.pickup}</p>
          <p>Drop point: {booking.drop_location}</p>
          <p>Journey: {booking.trip_date} · {booking.trip_time}</p>
        </div>
      </div>

      <div className="inv-facts">
        <h3>Bill details</h3>
        <div className="inv-facts-grid">
          <div className="line"><span>Vehicle</span><b>{vehicle}{vehicleMeta?.seats ? ` · ${vehicleMeta.seats}` : ""}</b></div>
          {vehicleMeta?.examples && <div className="line"><span>Car type</span><b>{vehicleMeta.examples}</b></div>}
          {booking.vehicle_number && <div className="line"><span>Car number</span><b>{booking.vehicle_number}</b></div>}
          {booking.driver_name && <div className="line"><span>Driver</span><b>{booking.driver_name}{booking.driver_mobile ? ` · ${booking.driver_mobile}` : ""}</b></div>}
          <div className="line"><span>Road distance</span><b>{km ? `${km} km` : "—"}</b></div>
          {showHours && <div className="line"><span>Package hours</span><b>{hours ? `${hours} hrs` : "—"}</b></div>}
          {showDays && <div className="line"><span>Number of days</span><b>{days ? `${days} ${days === 1 ? "day" : "days"}` : "1 day"}</b></div>}
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Particulars / charges</th>
            {showGst && <th>HSN / SAC</th>}
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(lines.length ? lines : [{ label: `Cab hire — ${trip}, ${vehicle}`, value: inr(tax.total) }]).map((line, index) => (
            <tr key={`${line.label}-${index}`}>
              <td>{index + 1}</td>
              <td>{line.label}</td>
              {showGst && <td>{index === 0 ? "996412" : ""}</td>}
              <td>{line.value}</td>
            </tr>
          ))}
          {showGst && (
            <tr>
              <td></td>
              <td>GST {tax.percent}% (inclusive in fare)</td>
              <td>996412</td>
              <td>{inr(tax.gst)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="inv-totals">
        {showGst && <div className="line"><span>Taxable value</span><b>{inr(tax.taxable)}</b></div>}
        {showGst && <div className="line"><span>CGST ({tax.percent / 2}%)</span><b>{inr(tax.cgst)}</b></div>}
        {showGst && <div className="line"><span>SGST ({tax.percent / 2}%)</span><b>{inr(tax.sgst)}</b></div>}
        <div className="total"><span>{showGst ? "Grand total (GST inclusive)" : "Grand total"}</span><span>{inr(tax.total)}</span></div>
        <div className="line"><span>Payment mode</span><b>{paymentModeLabel(booking)}</b></div>
        <div className="line"><span>Amount received</span><b>{inr(paid)}</b></div>
        <div className="line"><span>Balance due</span><b>{inr(due)}</b></div>
      </div>

      <div className="inv-paybox">
        <h3>Razorpay payment confirmation</h3>
        {booking.razorpay_payment_id || booking.payment_receipt?.payment_id ? (
          <>
            <p>This invoice includes the Razorpay receipt for the amount collected online.</p>
            <div className="line"><span>Gateway</span><b>{booking.payment_receipt?.provider || "Razorpay"}</b></div>
            <div className="line"><span>Payment ID</span><b>{booking.payment_receipt?.payment_id || booking.razorpay_payment_id}</b></div>
            <div className="line"><span>Order ID</span><b>{booking.payment_receipt?.order_id || booking.razorpay_order_id || "—"}</b></div>
            <div className="line"><span>Status</span><b>{booking.payment_receipt?.status || booking.payment_status}</b></div>
            <div className="line"><span>Method</span><b>{[booking.payment_receipt?.method, booking.payment_receipt?.vpa || booking.payment_receipt?.bank || booking.payment_receipt?.wallet, booking.payment_receipt?.card_last4 ? `****${booking.payment_receipt.card_last4}` : ""].filter(Boolean).join(" · ") || "Online"}</b></div>
            <div className="line"><span>Amount collected</span><b>{inr(booking.payment_receipt?.amount || paid)}</b></div>
            {booking.payment_receipt?.created_at && <div className="line"><span>Paid at</span><b>{String(booking.payment_receipt.created_at).replace("T", " ").slice(0, 19)}</b></div>}
            {booking.payment_receipt?.email && <div className="line"><span>Payer email</span><b>{booking.payment_receipt.email}</b></div>}
            {booking.payment_receipt?.contact && <div className="line"><span>Payer mobile</span><b>{booking.payment_receipt.contact}</b></div>}
          </>
        ) : (
          <p>No Razorpay payment yet. Online payment is pending. After Razorpay success, this block shows the payment confirmation.</p>
        )}
      </div>

      <div className="inv-grid inv-sign">
        <p>
          {showGst
            ? `GST on cab / radio-taxi passenger transport (SAC 996412) is shown as ${tax.percent}% inclusive (CGST ${tax.percent / 2}% + SGST ${tax.percent / 2}%). Toll, parking and permit are extra if they apply.`
            : "This is a trip invoice. GST is not applied. Toll, parking and permit are extra if they apply."}
        </p>
        <div className="inv-stamp">
          <img src="/logo.png?v=2" alt="" />
          <span>For {company.shortName}</span>
          <em>Authorised office</em>
        </div>
      </div>
    </div>
  );
}

export async function downloadInvoicePdf(bookingId) {
  const node = document.getElementById("jc-invoice");
  if (!node) return;
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const image = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = 210;
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(image, "PNG", 0, 0, width, Math.min(height, 297));
  pdf.save(`${bookingId || "invoice"}.pdf`);
}

export default function Invoice() {
  useTitle("Invoice", "Jayalakshmi Cabs invoice.");
  const { site } = useSite();
  const [params] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const autoPdf = useRef(false);

  useEffect(() => {
    const id = params.get("booking");
    const mobile = params.get("mobile");
    if (!id || !mobile) {
      setError("Open the invoice from your booking confirmation.");
      return;
    }
    api(`/api/bookings/${id}?mobile=${mobile}`)
      .then((data) => setBooking(data.booking))
      .catch((err) => setError(err.message));
  }, [params]);

  useEffect(() => {
    if (!booking || params.get("pdf") !== "1" || autoPdf.current) return undefined;
    autoPdf.current = true;
    const timer = setTimeout(() => downloadInvoicePdf(booking.booking_id), 400);
    return () => clearTimeout(timer);
  }, [booking, params]);

  if (error) return <section className="section"><div className="wrap card"><p className="error">{error}</p></div></section>;
  if (!booking) return <section className="section"><div className="wrap">Preparing tax invoice…</div></section>;

  const pageUrl = `${window.location.origin}/invoice?booking=${booking.booking_id}&mobile=${booking.mobile}`;
  const customerWa = invoiceWhatsAppUrl(booking, booking.mobile, site.company, pageUrl);
  const officeWa = invoiceWhatsAppUrl(booking, site.company.whatsapp, site.company, pageUrl);

  async function savePdf() {
    setBusy(true);
    try {
      await downloadInvoicePdf(booking.booking_id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section invoice-page">
      <div className="wrap">
        <InvoiceBody booking={booking} company={site.company} />
        <div className="actions no-print" style={{ marginTop: 18 }}>
          <button type="button" className="btn" disabled={busy} onClick={savePdf}>{busy ? "Creating PDF…" : "Download PDF invoice"}</button>
          <a className="btn alt" href={customerWa} target="_blank" rel="noreferrer">WhatsApp PDF link to customer</a>
          <a className="btn alt" href={officeWa} target="_blank" rel="noreferrer">WhatsApp PDF link to office</a>
          <Link className="btn alt" to={`/track?booking=${booking.booking_id}&mobile=${booking.mobile}`}>Track</Link>
        </div>
      </div>
    </section>
  );
}
