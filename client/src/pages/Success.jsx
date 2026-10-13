import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { invoiceWhatsAppUrl } from "@jc/shared";
import { api } from "../api.js";
import { InvoiceBody, downloadInvoicePdf } from "./Invoice.jsx";
import { useSite } from "../site.jsx";
import { useTitle } from "../useTitle.js";

export default function Success() {
  useTitle("Invoice", "Your Jayalakshmi Cabs invoice.", { path: "/success", noindex: true });
  const { site } = useSite();
  const [params] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = params.get("booking");
    const mobile = params.get("mobile");
    if (!id || !mobile) {
      setError("Open this page from your booking confirmation.");
      return;
    }
    api(`/api/bookings/${id}?mobile=${mobile}`)
      .then((data) => setBooking(data.booking))
      .catch((err) => setError(err.message));
  }, [params]);

  if (error) return <section className="section"><div className="wrap card"><p className="error">{error}</p><Link to="/book">Book again</Link></div></section>;
  if (!booking) return <section className="section"><div className="wrap">Preparing invoice…</div></section>;

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
        <p className="no-print">Booking confirmed. Download the PDF invoice, or send the PDF link on WhatsApp.</p>
        <InvoiceBody booking={booking} company={site.company} />
        <div className="actions no-print" style={{ marginTop: 18 }}>
          <button type="button" className="btn" disabled={busy} onClick={savePdf}>{busy ? "Creating PDF…" : "Download PDF invoice"}</button>
          <a className="btn alt" href={customerWa} target="_blank" rel="noreferrer">WhatsApp PDF link to customer</a>
          <a className="btn alt" href={officeWa} target="_blank" rel="noreferrer">WhatsApp PDF link to office</a>
          <Link className="btn alt" to={`/invoice?booking=${booking.booking_id}&mobile=${booking.mobile}`}>Open invoice</Link>
          <Link className="btn alt" to={`/track?booking=${booking.booking_id}&mobile=${booking.mobile}`}>Track booking</Link>
        </div>
      </div>
    </section>
  );
}
