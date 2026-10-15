import { Link } from "react-router-dom";
import { useTitle } from "../useTitle.js";

export default function NotFound() {
  useTitle("Page not found", "This page does not exist. Go to the Jayalakshmi Cabs home page, tariff or booking page.", { path: null, noindex: true });
  return (
    <section className="section">
      <div className="wrap">
        <p className="kicker">Error 404</p>
        <h1>Page not found</h1>
        <p className="lead">We could not find that page. Try one of these instead.</p>
        <div className="actions">
          <Link className="btn" to="/">Home</Link>
          <Link className="btn alt" to="/book">Book a cab</Link>
          <Link className="btn alt" to="/tariff">Tariff</Link>
        </div>
      </div>
    </section>
  );
}
