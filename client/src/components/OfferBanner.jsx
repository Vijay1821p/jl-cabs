import { activeOffer } from "@jc/shared";
import { useSite } from "../site.jsx";

export default function OfferBanner({ tripDate, tone = "page" }) {
  const { site } = useSite();
  const offer = activeOffer(site, tripDate);
  if (!offer) return null;
  return (
    <aside className={`offer-banner ${tone}`}>
      <strong>{offer.title}</strong>
      {offer.message ? <span>{offer.message}</span> : null}
      {offer.discountPercent > 0 ? <em>{offer.discountPercent}% off the published fare</em> : null}
    </aside>
  );
}
