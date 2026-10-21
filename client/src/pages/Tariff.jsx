import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CHARGES, LOCAL_PACKAGES, ONE_WAY_SLABS, OUTSTATION_PACKAGES, TARIFF_TERMS, VEHICLES, inr, listedVehicles, requestVehicleWhatsAppUrl } from "@jc/shared";
import { trackPixel } from "../metaPixel.js";
import { useSite } from "../site.jsx";
import { useTitle } from "../useTitle.js";

export default function Tariff() {
  useTitle(
    "Taxi Tariff in Coimbatore",
    "Published sedan and MUV tariff for one-way taxi, round trip, outstation packages and local hourly rental with Jayalakshmi Cabs.",
    { path: "/tariff" },
  );
  const { site } = useSite();
  useEffect(() => {
    trackPixel("ViewContent", { content_name: "tariff", content_type: "product_group" });
  }, []);
  const vehicles = listedVehicles(site.vehicles || VEHICLES);
  const requestWa = requestVehicleWhatsAppUrl(site.company);
  const charges = site.charges || CHARGES;
  const local = site.localPackages || LOCAL_PACKAGES;
  const outstation = site.outstationPackages || OUTSTATION_PACKAGES;
  const terms = site.tariffTerms || TARIFF_TERMS;
  return (
    <section className="section">
      <div className="wrap">
        <p className="kicker">Tariff chart</p>
        <h1>Taxi tariff</h1>
        <p className="lead">{site.pages.tariffLead}</p>
        <p className="muted">Sedan and MUV / Ertiga rates for one-way taxi, round trip and outstation packages from Coimbatore.</p>

        <article className="card" style={{ marginTop: 22, overflowX: "auto" }}>
          <h2>One-way trip up to 100 km</h2>
          <p>Fixed fare by distance. From 101 km the one-way per-km rate applies.</p>
          <table>
            <thead>
              <tr>
                <th>Distance</th>
                <th>Sedan fare</th>
                <th>MUV fare</th>
              </tr>
            </thead>
            <tbody>
              {(site.oneWaySlabs || ONE_WAY_SLABS).map((row) => (
                <tr key={row.upto}>
                  <td>{row.label}</td>
                  <td>{inr(row.sedan)}</td>
                  <td>{inr(row.muv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card" style={{ marginTop: 16, overflowX: "auto" }}>
          <h2>One-way trip and round trip</h2>
          <p>One-way is start point to drop point. The next column is the round-trip rate.</p>
          <table>
            <thead>
              <tr>
                <th>Vehicle type</th>
                <th>One-way trip (start point → drop point) / km</th>
                <th>Round trip / km</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.name} ({vehicle.seats})<br /><span className="muted">{vehicle.examples}</span></td>
                  <td>{inr(vehicle.drop)}</td>
                  <td>{inr(vehicle.round)}</td>
                </tr>
              ))}
              <tr>
                <td>Request a vehicle<br /><span className="muted">Innova Crysta and other cars</span></td>
                <td colSpan={2}><a href={requestWa} target="_blank" rel="noreferrer">WhatsApp for the fare</a></td>
              </tr>
            </tbody>
          </table>
        </article>

        <article className="card" style={{ marginTop: 16 }}>
          <h2>Terms & charges</h2>
          <ul className="terms">{terms.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="card" style={{ marginTop: 16, overflowX: "auto" }}>
          <h2>Outstation package trips</h2>
          <table>
            <thead>
              <tr>
                <th>Package type</th>
                <th>Sedan</th>
                <th>MUV</th>
              </tr>
            </thead>
            <tbody>
              {outstation.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{inr(row.sedan)}</td>
                  <td>{inr(row.muv)}</td>
                </tr>
              ))}
              <tr>
                <td>Additional hours</td>
                <td>{inr(charges.outstationExtraHour.sedan)}</td>
                <td>{inr(charges.outstationExtraHour.muv)}</td>
              </tr>
              <tr>
                <td>Additional km</td>
                <td>{inr(charges.outstationExtraKm.sedan)}</td>
                <td>{inr(charges.outstationExtraKm.muv)}</td>
              </tr>
            </tbody>
          </table>
          <p className="muted">Toll fees and interstate permit charges (if any) are extra.</p>
        </article>

        <article className="card" style={{ marginTop: 16, overflowX: "auto" }}>
          <h2>Local package trips</h2>
          <table>
            <thead>
              <tr>
                <th>Package type</th>
                <th>Sedan</th>
                <th>MUV</th>
              </tr>
            </thead>
            <tbody>
              {local.map((row) => (
                <tr key={row.hours}>
                  <td>{row.hours} hrs & {row.km} km</td>
                  <td>{inr(row.sedan)}</td>
                  <td>{inr(row.muv)}</td>
                </tr>
              ))}
              <tr>
                <td>Additional hours</td>
                <td>{inr(charges.localExtraHour.sedan)}</td>
                <td>{inr(charges.localExtraHour.muv)}</td>
              </tr>
              <tr>
                <td>Additional km</td>
                <td>{inr(charges.localExtraKm.sedan)}</td>
                <td>{inr(charges.localExtraKm.muv)}</td>
              </tr>
            </tbody>
          </table>
          <p className="muted">Toll fees and interstate permit charges (if any) are extra. Waiting on one-way trips is {inr(charges.waitingPerHour)} per hour.</p>
        </article>

        <Link className="btn" style={{ marginTop: 18 }} to="/book">Calculate my fare</Link>
      </div>
    </section>
  );
}
