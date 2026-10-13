import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { activeOffer, formatPhone, greetingWhatsAppUrl } from "@jc/shared";
import { useSite } from "../site.jsx";

const links = [
  ["/", "Home"],
  ["/tariff", "Tariff"],
  ["/book", "Book"],
  ["/track", "Track"],
  ["/admin", "Admin"],
];

export default function Layout() {
  const { site } = useSite();
  const company = site.company;
  const [open, setOpen] = useState(false);
  const wa = greetingWhatsAppUrl(company);
  const phone = formatPhone(company.phone);
  const offer = activeOffer(site);
  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>Open 24/7</span>
          <span>Tamil Nadu · Karnataka · Kerala · Andhra Pradesh</span>
          <a href={`https://instagram.com/${company.instagram}`} target="_blank" rel="noreferrer">@{company.instagram}</a>
        </div>
      </div>
      {offer && (
        <div className="offer-strip">
          <div className="wrap">{offer.title}{offer.discountPercent ? ` · ${offer.discountPercent}% off` : ""}{offer.message ? ` — ${offer.message}` : ""}</div>
        </div>
      )}
      <header className="site-header">
        <div className="wrap nav">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            <img className="logo" src="/logo.png?v=2" alt={company.name} />
            <span><strong>{company.shortName}</strong><span>{company.tagline}</span></span>
          </Link>
          <nav className={open ? "links open" : "links"}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}>{label}</NavLink>
            ))}
            <a className="btn call small" href={`tel:+91${company.phone}`}>Call {phone}</a>
          </nav>
          <button className="menu" onClick={() => setOpen((v) => !v)} aria-label="Menu">Menu</button>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="wrap foot-grid">
          <div>
            <img className="logo light" src="/logo.png?v=2" alt={company.name} />
            <strong>{company.name}</strong>
            <p>{company.tagline}</p>
            <p>{site.pages.footerBlurb}</p>
          </div>
          <div>
            <strong>Quick links</strong>
            <p><Link to="/book">Book a cab</Link></p>
            <p><Link to="/track">Track booking</Link></p>
            <p><Link to="/tariff">Tariff</Link></p>
            <p><Link to="/#routes">Popular routes</Link></p>
            <p><Link to="/#faq">Questions</Link></p>
          </div>
          <div>
            <strong>Policies</strong>
            <p><Link to="/terms">Terms & Conditions</Link></p>
            <p><Link to="/refund">Refund Policy</Link></p>
            <p><Link to="/privacy">Privacy Policy</Link></p>
          </div>
          <div>
            <strong>Contact</strong>
            <p><a href={`tel:+91${company.phone}`}>{phone}</a></p>
            <p><a href={wa} target="_blank" rel="noreferrer">WhatsApp</a></p>
            <p><a href={`https://instagram.com/${company.instagram}`} target="_blank" rel="noreferrer">@{company.instagram}</a></p>
            {company.address && (
              <p>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`} target="_blank" rel="noreferrer">{company.address}</a>
              </p>
            )}
          </div>
        </div>
        <div className="wrap socials">
          <a href={`https://instagram.com/${company.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" /></svg>
          </a>
          <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3.2A8.8 8.8 0 0 0 4.4 16.3L3 21l4.8-1.3A8.8 8.8 0 1 0 12 3.2Zm4.9 12.4c-.2.6-1.2 1.1-1.6 1.1-.4 0-1.8.3-3.7-.8-2.4-1.4-3.9-4-4-4.2-.1-.2-1-1.3-1-2.5s.6-1.8.9-2 .6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.8 2 .8 2.1s.1.3 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.4.3.1.5.1.7-.1l.8-1c.2-.2.4-.2.6-.1l2.1 1.1c.3.1.5.2.5.4 0 .2 0 .9-.4 1.5Z" /></svg>
          </a>
          <a href={`tel:+91${company.phone}`} aria-label="Call">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.2 3.8c.4-.4 1.1-.4 1.5 0l1.7 1.7c.4.4.5 1 .2 1.5L9.6 9c.8 1.6 2 2.8 3.6 3.6l2-1c.5-.3 1.1-.2 1.5.2l1.7 1.7c.4.4.4 1.1 0 1.5l-1.1 1.1c-.5.5-1.2.8-1.9.7-2.1-.2-4.6-1.6-6.8-3.8-2.2-2.2-3.6-4.7-3.8-6.8-.1-.7.2-1.4.7-1.9Z" /></svg>
          </a>
        </div>
        <div className="policy-bar">
          <div className="wrap">
            <Link to="/#faq">About Us</Link>
            <Link to="/#faq">FAQs</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund">Cancellation Policy</Link>
            <Link to="/#routes">Major Routes</Link>
            <Link to="/tariff">Tariff</Link>
            <Link to="/refund">Refund Policy</Link>
          </div>
        </div>
        <div className="wrap foot-base">
          <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <div className="pay-icons" aria-label="Payment methods">
            <span className="pay-badge upi">UPI</span>
            <span className="pay-badge gpay">GPay</span>
            <span className="pay-badge phonepe">PhonePe</span>
            <span className="pay-badge card">
              <i className="card-dots" />
              Cards
            </span>
            <span className="pay-badge bank">Net Banking</span>
          </div>
        </div>
        <div className="wrap notice">{site.fareNotice}</div>
      </footer>
      <div className="float-stack">
        <a className="float wa" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3.2A8.8 8.8 0 0 0 4.4 16.3L3 21l4.8-1.3A8.8 8.8 0 1 0 12 3.2Zm4.9 12.4c-.2.6-1.2 1.1-1.6 1.1-.4 0-1.8.3-3.7-.8-2.4-1.4-3.9-4-4-4.2-.1-.2-1-1.3-1-2.5s.6-1.8.9-2 .6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.8 2 .8 2.1s.1.3 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.4.3.1.5.1.7-.1l.8-1c.2-.2.4-.2.6-.1l2.1 1.1c.3.1.5.2.5.4 0 .2 0 .9-.4 1.5Z" /></svg>
        </a>
        <Link className="float chat" to="/#faq" aria-label="Questions">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
        </Link>
        <a className="float call" href={`tel:+91${company.phone}`} aria-label="Call">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.2 3.8c.4-.4 1.1-.4 1.5 0l1.7 1.7c.4.4.5 1 .2 1.5L9.6 9c.8 1.6 2 2.8 3.6 3.6l2-1c.5-.3 1.1-.2 1.5.2l1.7 1.7c.4.4.4 1.1 0 1.5l-1.1 1.1c-.5.5-1.2.8-1.9.7-2.1-.2-4.6-1.6-6.8-3.8-2.2-2.2-3.6-4.7-3.8-6.8-.1-.7.2-1.4.7-1.9Z" /></svg>
        </a>
      </div>
      <div className="dock">
        <a href={`tel:+91${company.phone}`}>Call now</a>
        <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </>
  );
}
