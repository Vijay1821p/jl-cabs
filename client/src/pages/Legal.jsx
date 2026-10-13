import { FARE_NOTICE, TARIFF_TERMS, formatPhone } from "@jc/shared";
import { useSite } from "../site.jsx";
import { useTitle } from "../useTitle.js";

function paras(text) {
  return String(text || "").split(/\n\n+/).filter(Boolean);
}

function lines(text) {
  return String(text || "").split(/\n/).map((row) => row.trim()).filter(Boolean);
}

export function Terms() {
  useTitle(
    "Terms & Conditions",
    "Booking terms, extra charges and luggage rules for Jayalakshmi Cabs taxi bookings.",
    { path: "/terms" },
  );
  const { site } = useSite();
  const terms = site.tariffTerms?.length ? site.tariffTerms : TARIFF_TERMS;
  return (
    <section className="section"><div className="wrap card">
      <h1>Terms & Conditions</h1>
      {paras(site.pages.termsIntro).map((item) => <p key={item}>{item}</p>)}
      <p>The website fare is an estimate from the road distance and the published tariff. {site.fareNotice || FARE_NOTICE}</p>
      <h2>Terms & Charges</h2>
      <ul className="terms">{terms.map((item) => <li key={item}>{item}</li>)}</ul>
      <h2>Luggage Policy</h2>
      <p>{site.pages.luggage}</p>
      <p>Please be ready at the pickup point at the booked time. Passengers must wear seat belts and must not exceed the vehicle seating.</p>
    </div></section>
  );
}

export function Refund() {
  useTitle(
    "Refund Policy",
    "Cancellation and refund rules for Jayalakshmi Cabs online taxi payments.",
    { path: "/refund" },
  );
  const { site } = useSite();
  return (
    <section className="section"><div className="wrap card">
      <h1>Refund Policy</h1>
      <ul className="terms">
        {lines(site.pages.refund).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div></section>
  );
}

export function Privacy() {
  useTitle(
    "Privacy Policy",
    "How Jayalakshmi Cabs stores name, mobile and trip details for cab bookings.",
    { path: "/privacy" },
  );
  const { site } = useSite();
  const phone = formatPhone(site.company.phone);
  return (
    <section className="section"><div className="wrap card">
      <h1>Privacy Policy</h1>
      {paras(site.pages.privacy).map((item) => <p key={item}>{item}</p>)}
      <p>Call {phone} if you want a booking record corrected.</p>
      {site.company.address && <p>Office: {site.company.address}</p>}
      <p>Website: <a href={site.company.website || "https://jlcabs.com"}>{site.company.website || "https://jlcabs.com"}</a></p>
    </div></section>
  );
}
